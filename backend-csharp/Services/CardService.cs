using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.Data.MySqlEntities;
using MonopolyAPI.DTOs;

namespace MonopolyAPI.Services;

public interface ICardService
{
    Task<CardDto> DrawRandomCard(string type);
    Task<ApplyCardResultDto> DrawAndApplyToGame(int gameId, int playerId, string type);
}

public class CardService : ICardService
{
    private readonly MonopolyMySqlDbContext _mySql;
    private readonly MonopolyDbContext _gameDb;

    public CardService(MonopolyMySqlDbContext mySql, MonopolyDbContext gameDb)
    {
        _mySql = mySql;
        _gameDb = gameDb;
    }

    public async Task<CardDto> DrawRandomCard(string type)
    {
        var normalized = NormalizeType(type);

        // MySQL: use ORDER BY RAND() LIMIT 1 for truly random row selection.
        // This avoids provider quirks where Skip/Count could lead to repeating the same row.
        var card = await _mySql.Cartas
            .FromSqlInterpolated($"SELECT * FROM cartas WHERE tipo = {normalized} ORDER BY RAND() LIMIT 1")
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (card == null)
            throw new InvalidOperationException($"No hay cartas del tipo {normalized}");

        return MapToDto(card);
    }

    public async Task<ApplyCardResultDto> DrawAndApplyToGame(int gameId, int playerId, string type)
    {
        var card = await DrawRandomCard(type);

        var players = await _gameDb.PlayersInGame
            .Where(p => p.GameId == gameId)
            .ToListAsync();

        if (players.Count == 0)
            throw new InvalidOperationException("Game not found or has no players");

        var triggerPlayer = players.FirstOrDefault(p => p.Id == playerId);
        if (triggerPlayer == null)
            throw new InvalidOperationException("Player not found in game");

        var deltas = new Dictionary<int, int>();

        void AddDelta(int targetPlayerId, int delta)
        {
            if (!deltas.TryAdd(targetPlayerId, delta))
                deltas[targetPlayerId] += delta;
        }

        switch (card.Effect)
        {
            case "ganar_dinero":
                AddDelta(triggerPlayer.Id, card.Value);
                break;

            case "perder_dinero":
                AddDelta(triggerPlayer.Id, -card.Value);
                break;

            case "cobrar_jugadores":
                foreach (var other in players.Where(p => p.Id != triggerPlayer.Id && !p.IsBankrupt))
                {
                    AddDelta(other.Id, -card.Value);
                    AddDelta(triggerPlayer.Id, card.Value);
                }
                break;

            case "pagar_jugadores":
                foreach (var other in players.Where(p => p.Id != triggerPlayer.Id && !p.IsBankrupt))
                {
                    AddDelta(other.Id, card.Value);
                    AddDelta(triggerPlayer.Id, -card.Value);
                }
                break;

            default:
                throw new InvalidOperationException($"Efecto de carta no soportado: {card.Effect}");
        }

        // Apply deltas with bankruptcy handling
        foreach (var p in players)
        {
            if (!deltas.TryGetValue(p.Id, out var delta) || delta == 0)
                continue;

            if (delta < 0)
            {
                var toPay = -delta;
                if (p.Money < toPay)
                {
                    p.IsBankrupt = true;
                    p.Money = 0;
                    // NOTE: we do not re-balance partial payments; keep it simple for now.
                    deltas[p.Id] = -toPay; // actual applied
                }
                else
                {
                    p.Money -= toPay;
                }
            }
            else
            {
                p.Money += delta;
            }
        }

        await _gameDb.SaveChangesAsync();

        var result = new ApplyCardResultDto
        {
            Card = card,
            GameId = gameId,
            TriggerPlayerId = playerId,
            MoneyDeltas = players.Select(p => new PlayerMoneyDeltaDto
            {
                PlayerId = p.Id,
                Delta = deltas.TryGetValue(p.Id, out var d) ? d : 0,
                NewMoney = p.Money,
                IsBankrupt = p.IsBankrupt
            }).ToList(),
            Message = card.Description
        };

        return result;
    }

    private static string NormalizeType(string type)
    {
        var t = (type ?? string.Empty).Trim().ToUpperInvariant();
        return t switch
        {
            "COMUNIDAD" => "COMUNIDAD",
            "SUERTE" => "SUERTE",
            _ => throw new InvalidOperationException("Tipo de carta inválido. Usa COMUNIDAD o SUERTE.")
        };
    }

    private static CardDto MapToDto(CartaEntity c) => new()
    {
        Id = c.Id,
        Type = c.Tipo,
        Description = c.Descripcion,
        Effect = c.Efecto,
        Value = c.Valor
    };
}
