using Microsoft.AspNetCore.Mvc;
using MonopolyAPI.DTOs;
using MonopolyAPI.Services;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IGameService _gameService;

    public GamesController(IGameService gameService)
    {
        _gameService = gameService;
    }

    [HttpPost]
    public async Task<ActionResult<GameDto>> CreateGame([FromBody] CreateGameDto createGameDto, [FromQuery] int hostUserId)
    {
        try
        {
            var game = await _gameService.CreateGame(hostUserId, createGameDto);
            return Ok(game);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GameDto>> GetGame(int id)
    {
        var game = await _gameService.GetGame(id);
        if (game == null)
            return NotFound();

        return Ok(game);
    }

    [HttpGet("available")]
    public async Task<ActionResult<List<GameDto>>> GetAvailableGames()
    {
        var games = await _gameService.GetAvailableGames();
        return Ok(games);
    }

    [HttpPost("{id}/join")]
    public async Task<ActionResult<GameDto>> JoinGame(int id, [FromQuery] int userId, [FromQuery] string token)
    {
        try
        {
            var game = await _gameService.JoinGame(id, userId, token);
            return Ok(game);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/start")]
    public async Task<ActionResult<GameDto>> StartGame(int id)
    {
        try
        {
            var game = await _gameService.StartGame(id);
            return Ok(game);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{gameId}/players/{playerId}")]
    public async Task<ActionResult<PlayerInGameDto>> GetPlayer(int gameId, int playerId)
    {
        var player = await _gameService.GetPlayerInGame(gameId, playerId);
        if (player == null)
            return NotFound();

        return Ok(player);
    }

    [HttpGet("{gameId}/next-player")]
    public async Task<ActionResult<PlayerInGameDto>> GetNextActivePlayer([FromQuery] int gameId, [FromQuery] int currentTurnOrder)
    {
        var nextPlayer = await _gameService.GetNextActivePlayers(gameId, currentTurnOrder);
        if (nextPlayer == null)
            return NotFound("No active players found");

        return Ok(nextPlayer);
    }

    [HttpPost("{gameId}/check-eliminated")]
    public async Task<ActionResult> CheckAndEliminateInactivePlayers(int gameId)
    {
        try
        {
            var hasEliminated = await _gameService.CheckAndEliminateInactivePlayers(gameId);
            var game = await _gameService.GetGame(gameId);
            return Ok(new { message = "Checked for inactive players", playersEliminated = hasEliminated, game = game });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
