using Microsoft.AspNetCore.Mvc;
using MonopolyAPI.DTOs;
using MonopolyAPI.Services;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly ICardService _cardService;

    public CardsController(ICardService cardService)
    {
        _cardService = cardService;
    }

    // Draw-only (frontend can apply locally)
    [HttpGet("draw")]
    public async Task<ActionResult<CardDrawDto>> Draw([FromQuery] string type)
    {
        try
        {
            var card = await _cardService.DrawRandomCard(type);
            return Ok(new CardDrawDto { Card = card });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Draw + apply to server-side game session
    [HttpPost("draw-and-apply")]
    public async Task<ActionResult<ApplyCardResultDto>> DrawAndApply(
        [FromQuery] int gameId,
        [FromQuery] int playerId,
        [FromQuery] string type)
    {
        try
        {
            var result = await _cardService.DrawAndApplyToGame(gameId, playerId, type);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Convenience endpoints for the two tile types
    [HttpGet("community/draw")]
    public Task<ActionResult<CardDrawDto>> DrawCommunity() => Draw("COMUNIDAD");

    [HttpGet("luck/draw")]
    public Task<ActionResult<CardDrawDto>> DrawLuck() => Draw("SUERTE");

    [HttpPost("community/draw-and-apply")]
    public Task<ActionResult<ApplyCardResultDto>> DrawAndApplyCommunity([FromQuery] int gameId, [FromQuery] int playerId)
        => DrawAndApply(gameId, playerId, "COMUNIDAD");

    [HttpPost("luck/draw-and-apply")]
    public Task<ActionResult<ApplyCardResultDto>> DrawAndApplyLuck([FromQuery] int gameId, [FromQuery] int playerId)
        => DrawAndApply(gameId, playerId, "SUERTE");
}
