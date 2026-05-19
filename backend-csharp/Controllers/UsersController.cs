using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.DTOs;
using MonopolyAPI.Services;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly MonopolyMySqlDbContext _mySql;

    public UsersController(IUserService userService, MonopolyMySqlDbContext mySql)
    {
        _userService = userService;
        _mySql = mySql;
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var user = await _userService.Login(request);
            if (user == null)
                return Unauthorized("Invalid username/email or password");

            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var user = await _userService.Register(request);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _userService.GetUserById(id);
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpGet("ranking")]
    public async Task<ActionResult<List<UserDto>>> GetTopPlayers([FromQuery] int count = 10)
    {
        var users = await _userService.GetTopPlayers(count);
        return Ok(users);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UserDto userDto)
    {
        try
        {
            var user = await _userService.UpdateUser(id, userDto);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/change-password")]
    public async Task<ActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
    {
        try
        {
            if (_userService is MySqlUserService mySqlService)
            {
                await mySqlService.ChangePassword(id, dto.CurrentPassword, dto.NewPassword);
                return Ok(new { message = "Contraseña actualizada correctamente" });
            }
            return BadRequest("Servicio no compatible");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/achievements")]
    public async Task<ActionResult<List<AchievementDto>>> GetAchievements(int id)
    {
        try
        {
            var logros = await _mySql.Logros.AsNoTracking().ToListAsync();
            var unlocked = await _mySql.UsuarioLogros
                .AsNoTracking()
                .Where(ul => ul.UsuarioId == id)
                .ToDictionaryAsync(ul => ul.LogroId, ul => ul.DesbloqueadoEn);

            var result = logros.Select(l => new AchievementDto
            {
                Id = l.Id,
                Name = l.Nombre,
                Description = l.Descripcion ?? string.Empty,
                Icon = l.Icono ?? "🏆",
                RewardPts = l.RecompensaPts,
                Earned = unlocked.ContainsKey(l.Id),
                EarnedAt = unlocked.ContainsKey(l.Id) ? unlocked[l.Id] : null
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
