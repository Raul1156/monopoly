using Microsoft.AspNetCore.Mvc;
using MonopolyAPI.Services;
using MonopolyAPI.Models;

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
    public async Task<ActionResult<List<BoardSpace>>> GetBoardSpaces()
    {
        var spaces = await _boardService.GetBoardSpaces();
        return Ok(spaces);
    }

    [HttpGet("properties")]
    public async Task<ActionResult<List<Property>>> GetAllProperties()
    {
        var properties = await _boardService.GetAllProperties();
        return Ok(properties);
    }

    [HttpGet("properties/{position}")]
    public async Task<ActionResult<Property>> GetPropertyByPosition(int position)
    {
        var property = await _boardService.GetPropertyByPosition(position);
        if (property == null)
            return NotFound();

        return Ok(property);
    }
}
