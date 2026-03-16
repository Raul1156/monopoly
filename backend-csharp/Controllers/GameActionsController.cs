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
                .FirstOrDefaultAsync(p => p.Id == playerId && p.GameId == gameId);

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
                    .FirstOrDefaultAsync(p => p.Id == dto.PlayerId && p.GameId == dto.GameId);

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
                var player = await _context.PlayersInGame.FirstOrDefaultAsync(p => p.Id == dto.PlayerId && p.GameId == dto.GameId);
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
                .FirstOrDefaultAsync(p => p.Id == dto.PlayerId && p.GameId == dto.GameId);

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
                PlayerInGameId = dto.PlayerId,
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
                .FirstOrDefaultAsync(p => p.Id == fromPlayerId && p.GameId == gameId);
            var toPlayer = await _context.PlayersInGame
                .FirstOrDefaultAsync(p => p.Id == toPlayerId && p.GameId == gameId);

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
                .FirstOrDefaultAsync(p => p.Id == dto.PlayerId && p.GameId == dto.GameId);

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
                .FirstOrDefaultAsync(po => po.PlayerInGameId == dto.PlayerId && po.PropertyId == dto.PropertyId);

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
}
