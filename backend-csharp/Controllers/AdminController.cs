using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.DTOs;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly MonopolyMySqlDbContext _mySql;

    public AdminController(MonopolyMySqlDbContext mySql)
    {
        _mySql = mySql;
    }

    private async Task<bool> IsAdmin(int userId)
    {
        var user = await _mySql.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        return user?.EsAdmin ?? false;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserDto>>> GetAllUsers([FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var users = await _mySql.Usuarios.AsNoTracking().OrderByDescending(u => u.Id).ToListAsync();
        var result = users.Select(u => new
        {
            u.Id,
            u.Username,
            u.Email,
            u.Elo,
            u.MonedaLobby,
            u.PartidasJugadas,
            u.PartidasGanadas,
            u.Activo,
            u.EsAdmin,
            u.CreadoEn,
            u.UltimoLogin
        });

        return Ok(result);
    }

    [HttpPut("users/{id}/ban")]
    public async Task<ActionResult> BanUser(int id, [FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        user.Activo = false;
        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();
        return Ok(new { message = "Usuario baneado" });
    }

    [HttpPut("users/{id}/unban")]
    public async Task<ActionResult> UnbanUser(int id, [FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        user.Activo = true;
        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();
        return Ok(new { message = "Usuario desbaneado" });
    }

    [HttpPut("users/{id}/make-admin")]
    public async Task<ActionResult> MakeAdmin(int id, [FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        user.EsAdmin = true;
        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();
        return Ok(new { message = "Usuario promovido a admin" });
    }

    [HttpPut("users/{id}/reset-elo")]
    public async Task<ActionResult> ResetElo(int id, [FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        user.Elo = 1000;
        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();
        return Ok(new { message = "ELO reseteado a 1000" });
    }

    [HttpGet("games")]
    public async Task<ActionResult> GetGames([FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var games = await _mySql.Partidas
            .AsNoTracking()
            .OrderByDescending(p => p.Id)
            .Take(50)
            .Select(p => new
            {
                p.Id,
                p.CodigoPartida,
                p.Estado,
                p.MaxJugadores,
                p.FechaInicio,
                p.FechaFin,
                p.GanadorId
            })
            .ToListAsync();

        return Ok(games);
    }

    [HttpDelete("games/{id}")]
    public async Task<ActionResult> CancelGame(int id, [FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var game = await _mySql.Partidas.FirstOrDefaultAsync(p => p.Id == id);
        if (game == null) return NotFound();

        game.Estado = "cancelada";
        game.FechaFin = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();
        return Ok(new { message = "Partida cancelada" });
    }

    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsDto>> GetStats([FromQuery] int adminUserId)
    {
        if (!await IsAdmin(adminUserId))
            return Forbid();

        var totalUsers = await _mySql.Usuarios.CountAsync();
        var activeUsers = await _mySql.Usuarios.CountAsync(u => u.Activo);
        var totalGames = await _mySql.Partidas.CountAsync();
        var activeGames = await _mySql.Partidas.CountAsync(p => p.Estado == "en_curso");

        return Ok(new AdminStatsDto
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalGames = totalGames,
            ActiveGames = activeGames,
            BannedUsers = totalUsers - activeUsers
        });
    }
}
