using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MonopolyAPI.Hubs;
using MonopolyAPI.Services;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LobbyController : ControllerBase
{
    private readonly ILobbyService _lobbyService;
    private readonly IHubContext<GameHub> _hubContext;

    public LobbyController(ILobbyService lobbyService, IHubContext<GameHub> hubContext)
    {
        _lobbyService = lobbyService;
        _hubContext = hubContext;
    }

    public class CreateLobbyRequest
    {
        public int MaxPlayers { get; set; }
    }

    [HttpPost("create")]
    public async Task<ActionResult<LobbyDto>> CreateLobby([FromBody] CreateLobbyRequest request, [FromQuery] int hostUserId)
    {
        try
        {
            var lobby = await _lobbyService.CreateGame(hostUserId, request.MaxPlayers);
            return Ok(lobby);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    public class JoinLobbyRequest
    {
        public string Code { get; set; } = string.Empty;
    }

    [HttpPost("join")]
    public async Task<ActionResult<LobbyDto>> JoinLobby([FromBody] JoinLobbyRequest request, [FromQuery] int userId)
    {
        try
        {
            var lobby = await _lobbyService.JoinGameByCode(request.Code, userId);
            
            // Notificar a los demás jugadores en el lobby
            await _hubContext.Clients.Group(GameHub.GetLobbyGroup(request.Code))
                .SendAsync("PlayerJoinedLobby", lobby);

            return Ok(lobby);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{code}")]
    public async Task<ActionResult<LobbyDto>> GetLobby(string code)
    {
        var lobby = await _lobbyService.GetGameByCode(code);
        if (lobby == null)
            return NotFound("Lobby no encontrado");

        return Ok(lobby);
    }

    [HttpPost("{code}/start")]
    public async Task<ActionResult<LobbyDto>> StartLobby(string code, [FromQuery] int hostUserId)
    {
        try
        {
            var lobby = await _lobbyService.StartGame(code, hostUserId);
            
            // Notificar a todos en el lobby que la partida ha empezado con el gameId
            await _hubContext.Clients.Group(GameHub.GetLobbyGroup(code))
                .SendAsync("GameStarted", lobby.GameId);

            return Ok(lobby);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{code}/leave")]
    public async Task<ActionResult> LeaveLobby(string code, [FromQuery] int userId)
    {
        try
        {
            await _lobbyService.LeaveGame(code, userId);
            
            var lobby = await _lobbyService.GetGameByCode(code);
            
            if (lobby != null && lobby.Status == "cancelada")
            {
                // El host abandonó y se canceló la partida
                await _hubContext.Clients.Group(GameHub.GetLobbyGroup(code))
                    .SendAsync("LobbyCancelled");
            }
            else if (lobby != null)
            {
                // Notificar a los demás que un jugador se fue
                await _hubContext.Clients.Group(GameHub.GetLobbyGroup(code))
                    .SendAsync("PlayerLeftLobby", lobby);
            }

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
