using Microsoft.AspNetCore.Mvc;
using MonopolyAPI.DTOs;
using MonopolyAPI.Services;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
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
}
