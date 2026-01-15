using Microsoft.AspNetCore.Mvc;
using MonopolyAPI.Services;
using MonopolyAPI.DTOs;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoardController : ControllerBase
{
    private readonly IBoardService _boardService;

    public BoardController(IBoardService boardService)
    {
        _boardService = boardService;
    }

    [HttpGet("spaces")]
    public async Task<ActionResult<List<BoardSpaceDto>>> GetBoardSpaces()
    {
        var spaces = await _boardService.GetBoardSpaces();
        return Ok(spaces);
    }

    [HttpGet("properties")]
    public async Task<ActionResult<List<PropertyDto>>> GetAllProperties()
    {
        var properties = await _boardService.GetAllProperties();
        return Ok(properties);
    }

    [HttpGet("properties/{position}")]
    public async Task<ActionResult<PropertyDto>> GetPropertyByPosition(int position)
    {
        var property = await _boardService.GetPropertyByPosition(position);
        if (property == null)
            return NotFound();

        return Ok(property);
    }
}
