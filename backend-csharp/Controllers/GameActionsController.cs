using Microsoft.AspNetCore.Mvc;
using MonopolyAPI.DTOs;
using MonopolyAPI.Services;
using MonopolyAPI.Data;
using MonopolyAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameActionsController : ControllerBase
{
    private readonly IGameSessionService _gameSessionService;
    private readonly MonopolyDbContext _context;

    public GameActionsController(IGameSessionService gameSessionService, MonopolyDbContext context)
    {
        _gameSessionService = gameSessionService;
        _context = context;
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
                player.JailTurns = 2; // provisional: set jail turns to 2
                moveResult.NewPosition = 10;
                moveResult.Message = "Has sido enviado a la cárcel";
            }
            else
            {
                player.Position = moveResult.NewPosition;
                if (moveResult.PassedGo)
                {
                    player.Money += 200;
                }
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

            var property = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == dto.PropertyId);

            if (property == null)
                return NotFound("Property not found");

            if (player.Money < property.Price)
                return BadRequest("Not enough money");

            var existingOwnership = await _context.PropertyOwnerships
                .AnyAsync(po => po.PropertyId == dto.PropertyId);

            if (existingOwnership)
                return BadRequest("Property already owned");

            player.Money -= property.Price;

            var ownership = new Models.PropertyOwnership
            {
                PlayerInGameId = dto.PlayerId,
                PropertyId = dto.PropertyId,
                AcquiredAt = DateTime.UtcNow
            };

            _context.PropertyOwnerships.Add(ownership);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Property purchased successfully", moneyLeft = player.Money });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("pay-rent")]
    public async Task<ActionResult> PayRent([FromQuery] int fromPlayerId, [FromQuery] int toPlayerId, [FromQuery] int amount, [FromQuery] int gameId)
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

            if (fromPlayer.Money < amount)
            {
                // Pagar lo que puede
                toPlayer.Money += fromPlayer.Money;
                fromPlayer.Money = 0;
                fromPlayer.IsBankrupt = true;
                await _context.SaveChangesAsync();
                
                return Ok(new { 
                    message = "Player bankrupt and eliminated from the game", 
                    isBankrupt = true,
                    playerEliminatedId = fromPlayerId,
                    transferredAmount = fromPlayer.Money
                });
            }

            fromPlayer.Money -= amount;
            toPlayer.Money += amount;
            await _context.SaveChangesAsync();

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
}
