using Microsoft.AspNetCore.Mvc;
using MonopolyAPI.DTOs;
using MonopolyAPI.Services;
using MonopolyAPI.Data;
using MonopolyAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MonopolyAPI.Hubs;
using MonopolyAPI.Data.MySqlEntities;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameActionsController : ControllerBase
{
    private readonly IGameSessionService _gameSessionService;
    private readonly MonopolyDbContext _context;
    private readonly MonopolyMySqlDbContext _mySql;
    private readonly IHubContext<GameHub> _hubContext;

    public GameActionsController(
        IGameSessionService gameSessionService,
        MonopolyDbContext context,
        MonopolyMySqlDbContext mySql,
        IHubContext<GameHub> hubContext)
    {
        _gameSessionService = gameSessionService;
        _context = context;
        _mySql = mySql;
        _hubContext = hubContext;
    }

    [HttpPost("roll-dice")]
    public ActionResult<DiceRollDto> RollDice()
    {
        var result = _gameSessionService.RollDice();
        return Ok(result);
    }

    [HttpPost("move")]
    public async Task<ActionResult<MoveResultDto>> MovePlayer([FromQuery] int gameId, [FromQuery] int playerId, [FromQuery] int? dice1 = null, [FromQuery] int? dice2 = null)
    {
        try
        {
            var player = await _context.PlayersInGame
                .FirstOrDefaultAsync(p => p.UserId == playerId && p.GameId == gameId);

            if (player == null)
                return NotFound("Player not found");

            if (player.IsInJail)
            {
                player.JailTurns--;
                if (player.JailTurns > 0)
                {
                    await _context.SaveChangesAsync();
                    return Ok(new MoveResultDto
                    {
                        NewPosition = player.Position,
                        SpaceName = "Jail",
                        SpaceType = "Jail",
                        DiceRoll = new DiceRollDto { Dice1 = 0, Dice2 = 0, Total = 0, IsDouble = false },
                        PassedGo = false,
                        MoneyChange = 0,
                        Message = $"En la cárcel. Turnos restantes: {player.JailTurns}"
                    });
                }
                else
                {
                    player.IsInJail = false;
                    // Player is free to move this turn? 
                    // Rule choice: They skip 3 turns. On 4th they move. 
                    // If we just released them, we can let the move proceed below or force them to wait 1 more turn.
                    // Standard: You roll to get out or wait 3 turns. If you wait 3 turns, on the 3rd turn you MUST roll and move.
                    // Simplified here: After 3 turns (JailTurns goes to 0), they are free and move normally THIS turn.
                }
            }

            DiceRollDto diceRoll;
            if (dice1.HasValue && dice2.HasValue)
            {
                diceRoll = new DiceRollDto
                {
                    Dice1 = dice1.Value,
                    Dice2 = dice2.Value,
                    Total = dice1.Value + dice2.Value,
                    IsDouble = dice1.Value == dice2.Value
                };
            }
            else
            {
                diceRoll = _gameSessionService.RollDice();
            }
            
            var boardSpace = await _context.BoardSpaces
                .FirstOrDefaultAsync(bs => bs.Position == player.Position);

            var moveResult = _gameSessionService.MovePlayer(
                player.Position,
                diceRoll,
                boardSpace?.Name ?? "Unknown"
            );

            // Update player position
            // If space is GoToJail (Comisaría), send player to Jail (position 10) and mark as in jail
            if (moveResult.SpaceType == "GoToJail")
            {
                player.Position = 10;
                player.IsInJail = true;
                player.JailTurns = 3; // Fixed 3 turns
                moveResult.NewPosition = 10;
                moveResult.Message = "Has sido enviado a la cárcel";
                moveResult.PassedGo = false; // Ensure no money added
            }
            else
            {
                player.Position = moveResult.NewPosition;
                if (moveResult.PassedGo)
                {
                    player.Money += 200;
                }
            }
            
            // If they just landed on Jail (Just Visiting), ensure IsInJail is false (unless they were already there)
            if (moveResult.NewPosition == 10 && !player.IsInJail)
            {
                // Just visiting, do nothing special
            }
            
            // Tax: Cell 4
            if (moveResult.NewPosition == 4)
            {
                 player.Money -= 200;
                 if (player.Money < 0) player.Money = 0; // Or handle bankruptcy logic here if needed
                 moveResult.MoneyChange = -200;
                 moveResult.Message = "Has pagado 200 de impuestos";
            }
            
            // Casino: Cell 38
            if (moveResult.NewPosition == 38)
            {
                 moveResult.SpaceType = "Casino";
                 moveResult.Message = "¡Bienvenido al Gran Casino!";
            }

            await _context.SaveChangesAsync();

            return Ok(moveResult);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    public class UseStationDto
    {
        public int GameId { get; set; }
        public int PlayerId { get; set; }
        public int FromPosition { get; set; }
        public int ToPosition { get; set; }
        // Stations owned by the player (positions), provided by the client when DB isn't available
        public List<int> OwnedStationPositions { get; set; } = new();
    }

    public class BuildUpgradeDto
    {
        public int GameId { get; set; }
        public int PlayerId { get; set; }
        public int PropertyId { get; set; }
    }

    public class PropertyUpgradeInfoDto
    {
        public int PropertyId { get; set; }
        public int OwnerId { get; set; }
        public int Level { get; set; }
    }

    [HttpPost("trade")]
    public async Task<ActionResult<TradeResultDto>> Trade([FromBody] TradeActionDto dto)
    {
        try
        {
            if (dto.FromPlayerId == dto.ToPlayerId)
                return BadRequest("Cannot trade with the same player");

            if (dto.CashFrom < 0 || dto.CashTo < 0)
                return BadRequest("Cash amounts cannot be negative");

            var fromIds = dto.PropertiesFrom.Select(p => p.PropertyId).ToList();
            var toIds = dto.PropertiesTo.Select(p => p.PropertyId).ToList();

            var fromOffersSomething = dto.CashFrom > 0 || fromIds.Count > 0;
            var toOffersSomething = dto.CashTo > 0 || toIds.Count > 0;

            if (!fromOffersSomething || !toOffersSomething)
                return BadRequest("Both players must offer at least money or one property");

            var isCashOnlyTrade = fromIds.Count == 0 && toIds.Count == 0;
            if (isCashOnlyTrade)
                return BadRequest("Cash-only trades are not allowed. At least one side must include a property");

            if (fromIds.Count != fromIds.Distinct().Count() || toIds.Count != toIds.Distinct().Count())
                return BadRequest("Duplicated properties are not allowed in a trade");

            if (fromIds.Intersect(toIds).Any())
                return BadRequest("The same property cannot be included on both sides of the trade");

            var fromPlayer = await _context.PlayersInGame
                .Include(p => p.OwnedProperties)
                    .ThenInclude(po => po.Property)
                .FirstOrDefaultAsync(p => p.UserId == dto.FromPlayerId && p.GameId == dto.GameId);

            var toPlayer = await _context.PlayersInGame
                .Include(p => p.OwnedProperties)
                    .ThenInclude(po => po.Property)
                .FirstOrDefaultAsync(p => p.UserId == dto.ToPlayerId && p.GameId == dto.GameId);

            if (fromPlayer == null || toPlayer == null)
                return NotFound("Player not found");

            if (fromPlayer.IsBankrupt || toPlayer.IsBankrupt)
                return BadRequest("Bankrupt players cannot negotiate");

            var fromValidation = await ValidateTradeProperties(dto.GameId, fromPlayer.UserId, fromIds);
            if (fromValidation != null)
                return BadRequest(fromValidation);

            var toValidation = await ValidateTradeProperties(dto.GameId, toPlayer.UserId, toIds);
            if (toValidation != null)
                return BadRequest(toValidation);

            var fromOwnerships = await _context.PropertyOwnerships
                .Where(po => po.PlayerInGameId == fromPlayer.Id && fromIds.Contains(po.PropertyId))
                .ToDictionaryAsync(po => po.PropertyId, po => po);

            var toOwnerships = await _context.PropertyOwnerships
                .Where(po => po.PlayerInGameId == toPlayer.Id && toIds.Contains(po.PropertyId))
                .ToDictionaryAsync(po => po.PropertyId, po => po);

            if (fromOwnerships.Count != fromIds.Count || toOwnerships.Count != toIds.Count)
                return BadRequest("One or more properties are not owned by the expected player");

            var allTradeIds = fromIds.Concat(toIds).Distinct().ToList();
            var propertiesCatalog = await _mySql.Propiedades
                .Include(p => p.Casilla)
                .Where(p => allTradeIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p);

            if (propertiesCatalog.Count != allTradeIds.Count)
                return BadRequest("One or more properties do not exist");

            var partidaProps = await _mySql.PropiedadesPartida
                .Where(pp => pp.PartidaId == dto.GameId && allTradeIds.Contains(pp.PropiedadId))
                .ToDictionaryAsync(pp => pp.PropiedadId, pp => pp);

            if (partidaProps.Count != allTradeIds.Count)
                return BadRequest("One or more properties are not owned in this game");

            if (fromIds.Any(pid => partidaProps[pid].PropietarioId != fromPlayer.UserId) ||
                toIds.Any(pid => partidaProps[pid].PropietarioId != toPlayer.UserId))
            {
                return BadRequest("Trade ownership validation failed");
            }

            var fromWallet = await GetOrCreatePartidaUsuario(dto.GameId, fromPlayer.UserId, fromPlayer.Money);
            var toWallet = await GetOrCreatePartidaUsuario(dto.GameId, toPlayer.UserId, toPlayer.Money);

            var fromMortgageCost = CalculateMortgageCost(dto.PropertiesTo, toOwnerships, propertiesCatalog);
            var toMortgageCost = CalculateMortgageCost(dto.PropertiesFrom, fromOwnerships, propertiesCatalog);

            var fromRequired = dto.CashFrom + fromMortgageCost;
            var toRequired = dto.CashTo + toMortgageCost;

            if (fromWallet.DineroActual < fromRequired)
                return BadRequest("From player does not have enough money for this trade");

            if (toWallet.DineroActual < toRequired)
                return BadRequest("To player does not have enough money for this trade");

            fromWallet.DineroActual = fromWallet.DineroActual - dto.CashFrom + dto.CashTo - fromMortgageCost;
            toWallet.DineroActual = toWallet.DineroActual - dto.CashTo + dto.CashFrom - toMortgageCost;

            fromPlayer.Money = fromWallet.DineroActual;
            toPlayer.Money = toWallet.DineroActual;

            foreach (var tradeProperty in dto.PropertiesFrom)
            {
                var ownership = fromOwnerships[tradeProperty.PropertyId];
                ownership.PlayerInGameId = toPlayer.Id;

                if (ownership.IsMortgaged)
                    ownership.IsMortgaged = !tradeProperty.ReleaseMortgageNow;

                var partida = partidaProps[tradeProperty.PropertyId];
                partida.PropietarioId = toPlayer.UserId;
            }

            foreach (var tradeProperty in dto.PropertiesTo)
            {
                var ownership = toOwnerships[tradeProperty.PropertyId];
                ownership.PlayerInGameId = fromPlayer.Id;

                if (ownership.IsMortgaged)
                    ownership.IsMortgaged = !tradeProperty.ReleaseMortgageNow;

                var partida = partidaProps[tradeProperty.PropertyId];
                partida.PropietarioId = fromPlayer.UserId;
            }

            await _context.SaveChangesAsync();
            await _mySql.SaveChangesAsync();

            var result = new TradeResultDto
            {
                Message = "Trade executed successfully",
                FromPlayerMoney = fromPlayer.Money,
                ToPlayerMoney = toPlayer.Money,
                TransferredFromPropertyIds = fromIds,
                TransferredToPropertyIds = toIds
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("use-station")]
    public async Task<ActionResult<MoveResultDto>> UseStation([FromBody] UseStationDto dto)
    {
        try
        {
            var stationPositions = new[] { 5, 15, 25, 35 };

            if (!stationPositions.Contains(dto.FromPosition))
                return BadRequest("Player is not on a station");

            if (!stationPositions.Contains(dto.ToPosition))
                return BadRequest("Destination is not a station");

            if (dto.FromPosition == dto.ToPosition)
                return BadRequest("Already on that station");

            // Prefer server-side ownership if available, otherwise use provided list
            List<int> ownedStationPositions = dto.OwnedStationPositions ?? new List<int>();

            try
            {
                var player = await _context.PlayersInGame
                    .Include(p => p.OwnedProperties)
                        .ThenInclude(po => po.Property)
                    .FirstOrDefaultAsync(p => p.UserId == dto.PlayerId && p.GameId == dto.GameId);

                if (player != null)
                {
                    ownedStationPositions = player.OwnedProperties
                        .Where(po => po.Property != null && stationPositions.Contains(po.Property.Position))
                        .Select(po => po.Property!.Position)
                        .Distinct()
                        .ToList();
                }
            }
            catch
            {
                // If DB not available, fall back to client-provided ownership
            }

            if (ownedStationPositions.Count < 2)
                return BadRequest("You need at least two owned stations to use this mechanic");

            var stationsList = stationPositions.ToList();
            var fromIndex = stationsList.IndexOf(dto.FromPosition);
            var toIndex = stationsList.IndexOf(dto.ToPosition);

            var start = Math.Min(fromIndex, toIndex);
            var end = Math.Max(fromIndex, toIndex);

            var required = stationsList.GetRange(start, end - start + 1);

            if (!required.All(r => ownedStationPositions.Contains(r)))
                return BadRequest("You must own all stations in between to teleport");

            // Update player position if DB available; otherwise just return the move result
            BoardSpace? boardSpace = null;
            try
            {
                boardSpace = await _context.BoardSpaces.FirstOrDefaultAsync(bs => bs.Position == dto.ToPosition);
                var player = await _context.PlayersInGame.FirstOrDefaultAsync(p => p.UserId == dto.PlayerId && p.GameId == dto.GameId);
                if (player != null)
                {
                    player.Position = dto.ToPosition;
                    await _context.SaveChangesAsync();
                }
            }
            catch
            {
                // ignore DB update failures
            }

            var moveResult = new MoveResultDto
            {
                NewPosition = dto.ToPosition,
                SpaceName = boardSpace?.Name ?? "Station",
                SpaceType = "Station",
                DiceRoll = new DiceRollDto { Dice1 = 0, Dice2 = 0, Total = 0, IsDouble = false },
                PassedGo = false,
                MoneyChange = 0,
                Message = "Teletransportado usando estaciones propiedad del jugador"
            };

            return Ok(moveResult);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("buy-property")]
    public async Task<ActionResult> BuyProperty([FromBody] BuyPropertyDto dto)
    {
        try
        {
            var player = await _context.PlayersInGame
                .Include(p => p.OwnedProperties)
                .FirstOrDefaultAsync(p => p.UserId == dto.PlayerId && p.GameId == dto.GameId);

            if (player == null)
                return NotFound("Player not found");

            if (player.IsBankrupt)
                return BadRequest("Bankrupt player cannot buy properties");

            var property = await _mySql.Propiedades
                .Include(p => p.Casilla)
                .FirstOrDefaultAsync(p => p.Id == dto.PropertyId);

            if (property == null)
                return NotFound("Property not found");

            var tipoCasilla = property.Casilla?.Tipo?.ToUpperInvariant();
            if (tipoCasilla is not ("PROPIEDAD" or "ESTACION" or "COMPANIA" or "COMPAÑIA"))
                return BadRequest("Space is not buyable");

            var existingOwnership = await _mySql.PropiedadesPartida
                .AnyAsync(po => po.PartidaId == dto.GameId && po.PropiedadId == dto.PropertyId);

            if (existingOwnership)
                return BadRequest("Property already owned");

            var partidaUsuario = await _mySql.PartidasUsuarios
                .FirstOrDefaultAsync(pu => pu.PartidaId == dto.GameId && pu.UsuarioId == player.UserId);

            if (partidaUsuario == null)
            {
                partidaUsuario = new PartidaUsuarioEntity
                {
                    PartidaId = dto.GameId,
                    UsuarioId = player.UserId,
                    DineroActual = player.Money
                };
                _mySql.PartidasUsuarios.Add(partidaUsuario);
            }

            if (partidaUsuario.DineroActual < property.Precio)
                return BadRequest("Not enough money");

            partidaUsuario.DineroActual -= property.Precio;
            player.Money = partidaUsuario.DineroActual;

            var inMemoryProperty = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == property.Id);

            if (inMemoryProperty == null)
            {
                inMemoryProperty = new Models.Property
                {
                    Id = property.Id,
                    Name = property.Nombre,
                    Type = tipoCasilla == "PROPIEDAD" ? PropertyType.Street
                        : tipoCasilla == "ESTACION" ? PropertyType.Station
                        : PropertyType.Utility,
                    Price = property.Precio,
                    RentBase = property.AlquilerBase,
                    RentWithHouse1 = property.AlquilerNivel1 ?? property.AlquilerBase,
                    RentWithHouse2 = property.AlquilerNivel2 ?? property.AlquilerBase,
                    RentWithHouse3 = property.AlquilerNivel3 ?? property.AlquilerBase,
                    RentWithHouse4 = property.AlquilerNivel4 ?? property.AlquilerBase,
                    RentWithHotel = property.AlquilerHotel ?? property.AlquilerBase,
                    HousePrice = property.PrecioMejora ?? 0,
                    HotelPrice = property.PrecioMejora ?? 0,
                    Color = property.ColorGrupo ?? string.Empty,
                    Position = property.Casilla?.Posicion ?? 0
                };
                _context.Properties.Add(inMemoryProperty);
            }

            var ownership = new Models.PropertyOwnership
            {
                PlayerInGameId = player.Id,
                PropertyId = inMemoryProperty.Id,
                AcquiredAt = DateTime.UtcNow
            };

            var partidaPropiedad = new PropiedadPartidaEntity
            {
                PartidaId = dto.GameId,
                PropiedadId = property.Id,
                Nivel = 0,
                PropietarioId = player.UserId
            };

            _context.PropertyOwnerships.Add(ownership);
            _mySql.PropiedadesPartida.Add(partidaPropiedad);

            await _context.SaveChangesAsync();
            await _mySql.SaveChangesAsync();

            return Ok(new { message = "Property purchased successfully", moneyLeft = player.Money });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("pay-rent")]
    public async Task<ActionResult> PayRent(
        [FromQuery] int fromPlayerId,
        [FromQuery] int toPlayerId,
        [FromQuery] int amount,
        [FromQuery] int gameId,
        [FromQuery] int? propertyId = null,
        [FromQuery] int? diceTotal = null)
    {
        try
        {
            var fromPlayer = await _context.PlayersInGame
                .FirstOrDefaultAsync(p => p.UserId == fromPlayerId && p.GameId == gameId);
            var toPlayer = await _context.PlayersInGame
                .FirstOrDefaultAsync(p => p.UserId == toPlayerId && p.GameId == gameId);

            if (fromPlayer == null || toPlayer == null)
                return NotFound("Player not found");

            if (fromPlayer.IsBankrupt)
                return BadRequest("Player is already bankrupt");

            var rentAmount = amount;
            if (rentAmount <= 0 && propertyId.HasValue)
            {
                var rentResult = await CalculateRentAsync(gameId, toPlayer.UserId, propertyId.Value, diceTotal);
                if (rentResult.error != null)
                    return BadRequest(rentResult.error);

                rentAmount = rentResult.amount;
            }

            if (rentAmount <= 0)
                return BadRequest("Invalid rent amount");

            var fromWallet = await GetOrCreatePartidaUsuario(gameId, fromPlayer.UserId, fromPlayer.Money);
            var toWallet = await GetOrCreatePartidaUsuario(gameId, toPlayer.UserId, toPlayer.Money);

            if (fromWallet.DineroActual < rentAmount)
            {
                // Pagar lo que puede
                toPlayer.Money += fromWallet.DineroActual;
                toWallet.DineroActual += fromWallet.DineroActual;
                fromWallet.DineroActual = 0;
                fromPlayer.Money = 0;
                fromPlayer.IsBankrupt = true;
                await _context.SaveChangesAsync();
                await _mySql.SaveChangesAsync();
                
                return Ok(new { 
                    message = "Player bankrupt and eliminated from the game", 
                    isBankrupt = true,
                    playerEliminatedId = fromPlayerId,
                    transferredAmount = 0
                });
            }

            fromPlayer.Money -= rentAmount;
            toPlayer.Money += rentAmount;
            fromWallet.DineroActual -= rentAmount;
            toWallet.DineroActual += rentAmount;
            await _context.SaveChangesAsync();
            await _mySql.SaveChangesAsync();

            return Ok(new { 
                message = "Rent paid successfully", 
                fromPlayerMoney = fromPlayer.Money, 
                toPlayerMoney = toPlayer.Money 
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("build-upgrade")]
    public async Task<ActionResult> BuildUpgrade([FromBody] BuildUpgradeDto dto)
    {
        try
        {
            var game = await _context.Games
                .Include(g => g.Players)
                .FirstOrDefaultAsync(g => g.Id == dto.GameId);

            if (game == null)
                return NotFound("Game not found");

            var player = await _context.PlayersInGame
                .FirstOrDefaultAsync(p => p.UserId == dto.PlayerId && p.GameId == dto.GameId);

            if (player == null)
                return NotFound("Player not found");

            var currentTurnPlayer = game.Players.FirstOrDefault(p => p.TurnOrder == game.CurrentTurn && !p.IsBankrupt);
            if (currentTurnPlayer == null || currentTurnPlayer.Id != player.Id)
                return BadRequest("Not this player's turn");

            if (player.IsBankrupt)
                return BadRequest("Bankrupt player cannot build");

            var propiedad = await _mySql.Propiedades
                .Include(p => p.Casilla)
                .FirstOrDefaultAsync(p => p.Id == dto.PropertyId);

            if (propiedad == null)
                return NotFound("Property not found");

            if (!string.Equals(propiedad.Casilla?.Tipo, "PROPIEDAD", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only street properties can be upgraded");

            if (string.IsNullOrWhiteSpace(propiedad.ColorGrupo))
                return BadRequest("Property has no color group");

            var allGroupProps = await _mySql.Propiedades
                .Include(p => p.Casilla)
                .Where(p => p.ColorGrupo == propiedad.ColorGrupo && p.Casilla != null && p.Casilla.Tipo == "PROPIEDAD")
                .ToListAsync();

            if (allGroupProps.Count == 0)
                return BadRequest("No properties found in this color group");

            var ownedGroup = await _mySql.PropiedadesPartida
                .Where(pp => pp.PartidaId == dto.GameId
                             && pp.PropietarioId == player.UserId
                             && allGroupProps.Select(p => p.Id).Contains(pp.PropiedadId))
                .ToListAsync();

            if (ownedGroup.Count != allGroupProps.Count)
                return BadRequest("Player must own all properties in this color group");

            var currentOwnership = ownedGroup.FirstOrDefault(pp => pp.PropiedadId == dto.PropertyId);
            if (currentOwnership == null)
                return BadRequest("Property is not owned by the player");

            var currentLevel = currentOwnership.Nivel;
            if (currentLevel >= 5)
                return BadRequest("Property already has a hotel");

            var upgradePrice = propiedad.PrecioMejora ?? 0;
            if (upgradePrice <= 0)
                return BadRequest("Property has no upgrade price");

            var wallet = await GetOrCreatePartidaUsuario(dto.GameId, player.UserId, player.Money);
            if (wallet.DineroActual < upgradePrice)
                return BadRequest("Not enough money for upgrade");

            var newLevel = currentLevel + 1;

            if (newLevel == 5 && ownedGroup.Any(g => g.Nivel < 4))
                return BadRequest("All properties in the group must have 4 houses before building a hotel");

            var levelsAfter = ownedGroup
                .Select(g => g.PropiedadId == currentOwnership.PropiedadId ? newLevel : g.Nivel)
                .ToList();

            var maxLevel = levelsAfter.Max();
            var minLevel = levelsAfter.Min();
            if (maxLevel - minLevel > 1)
                return BadRequest("Build evenly across the color group");

            currentOwnership.Nivel = newLevel;
            wallet.DineroActual -= upgradePrice;
            player.Money = wallet.DineroActual;

            var ownership = await _context.PropertyOwnerships
                .FirstOrDefaultAsync(po => po.PlayerInGameId == player.Id && po.PropertyId == dto.PropertyId);

            if (ownership != null)
            {
                if (newLevel >= 5)
                {
                    ownership.Houses = 4;
                    ownership.HasHotel = true;
                }
                else
                {
                    ownership.Houses = newLevel;
                    ownership.HasHotel = false;
                }
            }

            await _mySql.SaveChangesAsync();
            await _context.SaveChangesAsync();

            await _hubContext.Clients
                .Group(GameHub.GetGameGroup(dto.GameId))
                .SendAsync("PropertyUpgradeChanged", new
                {
                    propertyId = dto.PropertyId,
                    level = newLevel,
                    ownerId = player.UserId,
                    gameId = dto.GameId,
                    money = wallet.DineroActual
                });

            return Ok(new { message = "Upgrade purchased", level = newLevel, moneyLeft = wallet.DineroActual });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("property-upgrades")]
    public async Task<ActionResult<List<PropertyUpgradeInfoDto>>> GetPropertyUpgrades([FromQuery] int gameId)
    {
        var upgrades = await _mySql.PropiedadesPartida
            .AsNoTracking()
            .Where(pp => pp.PartidaId == gameId)
            .Select(pp => new PropertyUpgradeInfoDto
            {
                PropertyId = pp.PropiedadId,
                OwnerId = pp.PropietarioId,
                Level = pp.Nivel
            })
            .ToListAsync();

        return Ok(upgrades);
    }

    private async Task<string?> ValidateTradeProperties(int gameId, int ownerUserId, List<int> propertyIds)
    {
        if (propertyIds.Count == 0)
            return null;

        var ownerships = await _mySql.PropiedadesPartida
            .Where(pp => pp.PartidaId == gameId && propertyIds.Contains(pp.PropiedadId))
            .ToListAsync();

        if (ownerships.Count != propertyIds.Count)
            return "One or more properties are not owned in this game";

        if (ownerships.Any(pp => pp.PropietarioId != ownerUserId))
            return "A player can only trade their own properties";

        var props = await _mySql.Propiedades
            .Include(p => p.Casilla)
            .Where(p => propertyIds.Contains(p.Id))
            .ToListAsync();

        foreach (var prop in props)
        {
            var tipo = prop.Casilla?.Tipo?.ToUpperInvariant();
            if (tipo != "PROPIEDAD")
                continue;

            if (string.IsNullOrWhiteSpace(prop.ColorGrupo))
                continue;

            var groupPropertyIds = await _mySql.Propiedades
                .Include(p => p.Casilla)
                .Where(p => p.ColorGrupo == prop.ColorGrupo && p.Casilla != null && p.Casilla.Tipo == "PROPIEDAD")
                .Select(p => p.Id)
                .ToListAsync();

            if (groupPropertyIds.Count == 0)
                continue;

            var hasBuildingsInGroup = await _mySql.PropiedadesPartida
                .AnyAsync(pp => pp.PartidaId == gameId && groupPropertyIds.Contains(pp.PropiedadId) && pp.Nivel > 0);

            if (hasBuildingsInGroup)
                return "Cannot trade a street while there are houses or hotels in its color group";
        }

        return null;
    }

    private static int CalculateMortgageCost(
        List<TradePropertyDto> tradeProperties,
        Dictionary<int, Models.PropertyOwnership> ownershipByPropertyId,
        Dictionary<int, PropiedadEntity> catalog)
    {
        var total = 0;

        foreach (var tradeProperty in tradeProperties)
        {
            if (!ownershipByPropertyId.TryGetValue(tradeProperty.PropertyId, out var ownership))
                continue;

            if (!ownership.IsMortgaged)
                continue;

            if (!catalog.TryGetValue(tradeProperty.PropertyId, out var prop))
                continue;

            var mortgageValue = Math.Max(0, prop.Precio / 2);
            var interest = (int)Math.Ceiling(mortgageValue * 0.10m);

            total += tradeProperty.ReleaseMortgageNow
                ? mortgageValue + interest
                : interest;
        }

        return total;
    }

    private async Task<(int amount, string? error)> CalculateRentAsync(int gameId, int ownerUserId, int propertyId, int? diceTotal)
    {
        var propiedad = await _mySql.Propiedades
            .Include(p => p.Casilla)
            .FirstOrDefaultAsync(p => p.Id == propertyId);

        if (propiedad == null)
            return (0, "Property not found");

        var tipoCasilla = propiedad.Casilla?.Tipo?.ToUpperInvariant();
        if (tipoCasilla == null)
            return (0, "Property has no board space");

        if (tipoCasilla == "PROPIEDAD")
        {
            var ownership = await _mySql.PropiedadesPartida
                .FirstOrDefaultAsync(pp => pp.PartidaId == gameId && pp.PropiedadId == propertyId && pp.PropietarioId == ownerUserId);

            if (ownership == null)
                return (0, "Property is not owned by the expected player");

            var level = ownership.Nivel;
            if (level <= 0)
                return (propiedad.AlquilerBase, null);

            if (level == 1)
                return (propiedad.AlquilerNivel1 ?? propiedad.AlquilerBase, null);
            if (level == 2)
                return (propiedad.AlquilerNivel2 ?? propiedad.AlquilerBase, null);
            if (level == 3)
                return (propiedad.AlquilerNivel3 ?? propiedad.AlquilerBase, null);
            if (level == 4)
                return (propiedad.AlquilerNivel4 ?? propiedad.AlquilerBase, null);

            return (propiedad.AlquilerHotel ?? propiedad.AlquilerBase, null);
        }

        if (tipoCasilla == "ESTACION")
        {
            var stationIds = await _mySql.Propiedades
                .Include(p => p.Casilla)
                .Where(p => p.Casilla != null && p.Casilla.Tipo == "ESTACION")
                .Select(p => p.Id)
                .ToListAsync();

            var ownedStations = await _mySql.PropiedadesPartida
                .CountAsync(pp => pp.PartidaId == gameId && pp.PropietarioId == ownerUserId && stationIds.Contains(pp.PropiedadId));

            var rent = 25 * (int)Math.Pow(2, Math.Max(0, ownedStations - 1));
            return (rent, null);
        }

        if (tipoCasilla == "COMPANIA" || tipoCasilla == "COMPAÑIA")
        {
            if (!diceTotal.HasValue || diceTotal.Value <= 0)
                return (0, "Dice total required for utility rent calculation");

            var utilityIds = await _mySql.Propiedades
                .Include(p => p.Casilla)
                .Where(p => p.Casilla != null && (p.Casilla.Tipo == "COMPANIA" || p.Casilla.Tipo == "COMPAÑIA"))
                .Select(p => p.Id)
                .ToListAsync();

            var ownedUtilities = await _mySql.PropiedadesPartida
                .CountAsync(pp => pp.PartidaId == gameId && pp.PropietarioId == ownerUserId && utilityIds.Contains(pp.PropiedadId));

            var multiplier = ownedUtilities >= 2 ? 10 : 4;
            return (diceTotal.Value * multiplier, null);
        }

        return (0, "Unsupported property type for rent calculation");
    }

    private async Task<PartidaUsuarioEntity> GetOrCreatePartidaUsuario(int gameId, int userId, int fallbackMoney)
    {
        var wallet = await _mySql.PartidasUsuarios
            .FirstOrDefaultAsync(pu => pu.PartidaId == gameId && pu.UsuarioId == userId);

        if (wallet != null)
            return wallet;

        wallet = new PartidaUsuarioEntity
        {
            PartidaId = gameId,
            UsuarioId = userId,
            DineroActual = fallbackMoney
        };

        _mySql.PartidasUsuarios.Add(wallet);
        await _mySql.SaveChangesAsync();
        return wallet;
    }

    // === MORTGAGE ===

    [HttpPost("mortgage")]
    public async Task<ActionResult> Mortgage([FromBody] MortgageRequestDto dto)
    {
        try
        {
            var player = await _context.PlayersInGame
                .Include(p => p.OwnedProperties)
                .FirstOrDefaultAsync(p => p.UserId == dto.PlayerId && p.GameId == dto.GameId);
            if (player == null) return NotFound("Player not found");

            var ownership = player.OwnedProperties.FirstOrDefault(po => po.PropertyId == dto.PropertyId);
            if (ownership == null) return BadRequest("Player does not own this property");
            if (ownership.IsMortgaged) return BadRequest("Property is already mortgaged");

            // Check no buildings in color group
            var propiedad = await _mySql.Propiedades.Include(p => p.Casilla).FirstOrDefaultAsync(p => p.Id == dto.PropertyId);
            if (propiedad == null) return NotFound("Property not found");

            if (!string.IsNullOrWhiteSpace(propiedad.ColorGrupo))
            {
                var groupIds = await _mySql.Propiedades
                    .Where(p => p.ColorGrupo == propiedad.ColorGrupo)
                    .Select(p => p.Id).ToListAsync();

                var hasBuildings = await _mySql.PropiedadesPartida
                    .AnyAsync(pp => pp.PartidaId == dto.GameId && groupIds.Contains(pp.PropiedadId) && pp.Nivel > 0);

                if (hasBuildings) return BadRequest("Debes vender los edificios del grupo antes de hipotecar");
            }

            ownership.IsMortgaged = true;
            var mortgageValue = propiedad.Precio / 2;
            player.Money += mortgageValue;

            var wallet = await GetOrCreatePartidaUsuario(dto.GameId, player.UserId, player.Money);
            wallet.DineroActual = player.Money;

            await _context.SaveChangesAsync();
            await _mySql.SaveChangesAsync();

            await _hubContext.Clients.Group(GameHub.GetGameGroup(dto.GameId))
                .SendAsync("PropertyMortgaged", new { propertyId = dto.PropertyId, playerId = dto.PlayerId, money = player.Money });

            return Ok(new { message = $"Propiedad hipotecada. Recibiste ${mortgageValue}", moneyLeft = player.Money });
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("unmortgage")]
    public async Task<ActionResult> Unmortgage([FromBody] MortgageRequestDto dto)
    {
        try
        {
            var player = await _context.PlayersInGame
                .Include(p => p.OwnedProperties)
                .FirstOrDefaultAsync(p => p.UserId == dto.PlayerId && p.GameId == dto.GameId);
            if (player == null) return NotFound("Player not found");

            var ownership = player.OwnedProperties.FirstOrDefault(po => po.PropertyId == dto.PropertyId);
            if (ownership == null) return BadRequest("Player does not own this property");
            if (!ownership.IsMortgaged) return BadRequest("Property is not mortgaged");

            var propiedad = await _mySql.Propiedades.FirstOrDefaultAsync(p => p.Id == dto.PropertyId);
            if (propiedad == null) return NotFound("Property not found");

            var mortgageValue = propiedad.Precio / 2;
            var interest = (int)Math.Ceiling(mortgageValue * 0.10m);
            var cost = mortgageValue + interest;

            if (player.Money < cost) return BadRequest($"No tienes suficiente dinero. Costo: ${cost}");

            ownership.IsMortgaged = false;
            player.Money -= cost;

            var wallet = await GetOrCreatePartidaUsuario(dto.GameId, player.UserId, player.Money);
            wallet.DineroActual = player.Money;

            await _context.SaveChangesAsync();
            await _mySql.SaveChangesAsync();

            await _hubContext.Clients.Group(GameHub.GetGameGroup(dto.GameId))
                .SendAsync("PropertyUnmortgaged", new { propertyId = dto.PropertyId, playerId = dto.PlayerId, money = player.Money });

            return Ok(new { message = $"Hipoteca levantada. Pagaste ${cost}", moneyLeft = player.Money });
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    // === END GAME (ELO + Stats) ===

    [HttpPost("end-game")]
    public async Task<ActionResult> EndGame([FromQuery] int gameId, [FromQuery] int? winnerId = null)
    {
        try
        {
            var partida = await _mySql.Partidas
                .Include(p => p.Jugadores)
                .FirstOrDefaultAsync(p => p.Id == gameId);

            if (partida == null) return NotFound("Game not found");
            if (partida.Estado == "finalizada") return BadRequest("Game already finished");

            var allJugadores = partida.Jugadores.ToList();
            var winner = winnerId.HasValue ? allJugadores.FirstOrDefault(j => j.UsuarioId == winnerId.Value) : null;
            
            var sortedJugadores = allJugadores
                .Where(j => j.UsuarioId != winnerId)
                .OrderByDescending(j => j.Activo)
                .ThenByDescending(j => j.DineroActual)
                .ToList();

            if (winner != null)
            {
                sortedJugadores.Insert(0, winner);
            }

            var totalPlayers = sortedJugadores.Count;

            // Assign final positions (1 = winner, highest number = first eliminated)
            int position = 1;
            foreach (var j in sortedJugadores)
            {
                j.PosicionFinal = position;
                position++;
            }

            // Calculate ELO deltas based on player count and position
            var eloDeltas = GetEloDeltas(totalPlayers);

            foreach (var j in sortedJugadores)
            {
                var pos = j.PosicionFinal ?? totalPlayers;
                var delta = pos <= eloDeltas.Length ? eloDeltas[pos - 1] : eloDeltas[^1];
                j.EloGanado = delta;

                var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == j.UsuarioId);
                if (user != null)
                {
                    user.Elo = Math.Max(0, user.Elo + delta);
                    user.PartidasJugadas++;

                    // Calculate time played
                    if (partida.FechaInicio != default)
                    {
                        var duration = (DateTime.UtcNow - partida.FechaInicio).TotalMinutes;
                        user.TiempoJugadoMinutos += (int)Math.Round(duration);
                    }

                    if (pos == 1)
                    {
                        user.PartidasGanadas++;
                        user.RachaActual++;
                        if (user.RachaActual > user.MejorRacha)
                            user.MejorRacha = user.RachaActual;
                    }
                    else
                    {
                        user.RachaActual = 0;
                    }

                    user.ActualizadoEn = DateTime.UtcNow;

                    // Check and unlock achievements
                    await CheckAndUnlockAchievements(user);
                }
            }

            var actualWinnerId = sortedJugadores.FirstOrDefault()?.UsuarioId;
            partida.Estado = "finalizada";
            partida.GanadorId = actualWinnerId;
            partida.FechaFin = DateTime.UtcNow;

            await _mySql.SaveChangesAsync();

            await _hubContext.Clients.Group(GameHub.GetGameGroup(gameId))
                .SendAsync("GameEnded", new
                {
                    gameId,
                    winnerId = actualWinnerId,
                    results = sortedJugadores.Select(j => new { j.UsuarioId, j.PosicionFinal, j.EloGanado })
                });

            return Ok(new { message = "Partida finalizada", winnerId = actualWinnerId });
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    private static int[] GetEloDeltas(int totalPlayers)
    {
        return totalPlayers switch
        {
            4 => new[] { 20, 10, -10, -20 },
            3 => new[] { 20, 0, -20 },
            _ => new[] { 20, -20 }
        };
    }

    private async Task CheckAndUnlockAchievements(Data.MySqlEntities.UsuarioEntity user)
    {
        var logros = await _mySql.Logros.AsNoTracking().ToListAsync();
        var existing = await _mySql.UsuarioLogros
            .Where(ul => ul.UsuarioId == user.Id)
            .Select(ul => ul.LogroId)
            .ToListAsync();

        foreach (var logro in logros)
        {
            if (existing.Contains(logro.Id)) continue;

            bool earned = logro.Condicion switch
            {
                "primera_victoria" => user.PartidasGanadas >= 1,
                "millonario" => user.MonedaLobby >= logro.ValorObjetivo,
                "veterano" => user.PartidasJugadas >= logro.ValorObjetivo,
                "racha_5" => user.MejorRacha >= 5,
                "racha_10" => user.MejorRacha >= 10,
                "maestro_casino" => user.MonedaLobby >= 100,
                _ => false
            };

            if (earned)
            {
                _mySql.UsuarioLogros.Add(new Data.MySqlEntities.UsuarioLogroEntity
                {
                    UsuarioId = user.Id,
                    LogroId = logro.Id,
                    DesbloqueadoEn = DateTime.UtcNow
                });

                // Give reward
                user.MonedaLobby += logro.RecompensaPts;
            }
        }
    }
}
