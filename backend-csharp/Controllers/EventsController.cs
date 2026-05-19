using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.DTOs;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly MonopolyMySqlDbContext _mySql;

    public EventsController(MonopolyMySqlDbContext mySql)
    {
        _mySql = mySql;
    }

    [HttpGet("daily")]
    public async Task<ActionResult<List<DailyRewardDto>>> GetDailyRewards([FromQuery] int userId)
    {
        try
        {
            var rewards = await _mySql.Recompensas
                .AsNoTracking()
                .Where(r => r.Activa)
                .ToListAsync();

            var today = DateTime.UtcNow.Date;

            var claimed = await _mySql.HistorialRecompensas
                .AsNoTracking()
                .Where(h => h.UsuarioId == userId && h.Fecha >= today)
                .Select(h => h.RecompensaId)
                .ToListAsync();

            var result = rewards.Select(r => new DailyRewardDto
            {
                Id = r.Id,
                Name = r.Nombre,
                Description = r.Descripcion ?? string.Empty,
                Type = r.Tipo,
                MoneyReward = r.MonedaLobby,
                Claimed = claimed.Contains(r.Id)
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("claim/{recompensaId}")]
    public async Task<ActionResult> ClaimReward(int recompensaId, [FromQuery] int userId)
    {
        try
        {
            var reward = await _mySql.Recompensas.FirstOrDefaultAsync(r => r.Id == recompensaId);
            if (reward == null)
                return NotFound("Recompensa no encontrada");

            if (!reward.Activa)
                return BadRequest("Esta recompensa no está disponible");

            var today = DateTime.UtcNow.Date;
            var alreadyClaimed = await _mySql.HistorialRecompensas
                .AnyAsync(h => h.UsuarioId == userId && h.RecompensaId == recompensaId && h.Fecha >= today);

            if (alreadyClaimed)
                return BadRequest("Ya has reclamado esta recompensa hoy");

            // Check if game-based reward requires a game played today
            if (reward.Tipo == "partida")
            {
                var playedToday = await _mySql.PartidasUsuarios
                    .AnyAsync(pu => pu.UsuarioId == userId && pu.Partida != null && pu.Partida.FechaInicio >= today);
                if (!playedToday)
                    return BadRequest("Debes jugar al menos una partida hoy para reclamar esta recompensa");
            }

            // Give money to user
            var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return NotFound("Usuario no encontrado");

            user.MonedaLobby += reward.MonedaLobby;
            user.ActualizadoEn = DateTime.UtcNow;

            // Record in history
            _mySql.HistorialRecompensas.Add(new Data.MySqlEntities.HistorialRecompensaEntity
            {
                UsuarioId = userId,
                RecompensaId = recompensaId,
                MonedaRecibida = reward.MonedaLobby,
                GemasRecibidas = 0,
                ExperienciaRecibida = 0,
                Fecha = DateTime.UtcNow
            });

            await _mySql.SaveChangesAsync();

            return Ok(new { message = $"¡Has recibido {reward.MonedaLobby} pts!", newBalance = user.MonedaLobby });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
