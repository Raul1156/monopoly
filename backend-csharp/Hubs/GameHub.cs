using Microsoft.AspNetCore.SignalR;

namespace MonopolyAPI.Hubs;

public class GameHub : Hub
{
    // === Lobby methods ===
    public Task JoinLobby(string code)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GetLobbyGroup(code));
    }

    public Task LeaveLobby(string code)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetLobbyGroup(code));
    }

    // === Game methods ===
    public Task JoinGame(int gameId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GetGameGroup(gameId));
    }

    public Task LeaveGame(int gameId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGameGroup(gameId));
    }

    // === Broadcast methods (called by clients to sync state) ===

    /// <summary>
    /// Broadcast that a player rolled dice and moved.
    /// </summary>
    public async Task BroadcastDiceRoll(int gameId, int userId, int diceValue, int newPosition, bool passedGo, int moneyAfter)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("DiceRolled", new
            {
                userId,
                diceValue,
                newPosition,
                passedGo,
                moneyAfter
            });
    }

    /// <summary>
    /// Broadcast that the turn has changed to a new player.
    /// </summary>
    public async Task BroadcastEndTurn(int gameId, int nextPlayerId)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("TurnChanged", new
            {
                nextPlayerId
            });
    }

    /// <summary>
    /// Broadcast that a player bought a property.
    /// </summary>
    public async Task BroadcastPropertyBought(int gameId, int userId, int propertyPosition, int moneyLeft, int propertyDbId)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("PropertyBought", new
            {
                userId,
                propertyPosition,
                moneyLeft,
                propertyDbId
            });
    }

    /// <summary>
    /// Broadcast that a player went to jail.
    /// </summary>
    public async Task BroadcastPlayerJailed(int gameId, int userId, int jailTurns)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("PlayerJailed", new
            {
                userId,
                jailTurns
            });
    }

    /// <summary>
    /// Broadcast a card effect that changes money for one or more players.
    /// </summary>
    public async Task BroadcastCardEffect(int gameId, object[] playerMoneyUpdates)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("CardEffectApplied", playerMoneyUpdates);
    }

    /// <summary>
    /// Broadcast a tax payment.
    /// </summary>
    public async Task BroadcastTaxPaid(int gameId, int userId, int moneyAfter)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("TaxPaid", new
            {
                userId,
                moneyAfter
            });
    }

    // === Group name helpers ===
    public static string GetGameGroup(int gameId) => $"game-{gameId}";
    public static string GetLobbyGroup(string code) => $"lobby-{code.ToUpper()}";
}
