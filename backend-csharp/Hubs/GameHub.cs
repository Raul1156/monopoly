using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace MonopolyAPI.Hubs;

public class GameHub : Hub
{
    // Track which connection belongs to which game/user
    private static readonly ConcurrentDictionary<string, (int GameId, int UserId, string Username)> _connectionMap = new();

    // Track active players per game (gameId -> set of userIds)
    private static readonly ConcurrentDictionary<int, ConcurrentDictionary<int, string>> _gamePlayers = new();

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
    public async Task JoinGame(int gameId, int userId, string username)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GetGameGroup(gameId));

        // Register this connection
        _connectionMap[Context.ConnectionId] = (gameId, userId, username);

        // Track player in the game
        var players = _gamePlayers.GetOrAdd(gameId, _ => new ConcurrentDictionary<int, string>());
        players[userId] = username;
    }

    public Task LeaveGame(int gameId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGameGroup(gameId));
    }

    /// <summary>
    /// Called by a client that explicitly leaves/abandons the game.
    /// </summary>
    public async Task AbandonGame(int gameId, int userId, string username)
    {
        // Remove from tracking
        _connectionMap.TryRemove(Context.ConnectionId, out _);
        var players = _gamePlayers.GetOrAdd(gameId, _ => new ConcurrentDictionary<int, string>());
        players.TryRemove(userId, out _);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGameGroup(gameId));

        // Notify remaining players
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("PlayerLeft", new
            {
                userId,
                username,
                reason = "abandoned"
            });

        // Check if only one active player remains → win by forfeit
        if (players.Count == 1)
        {
            var winner = players.First();
            await Clients.Group(GetGameGroup(gameId))
                .SendAsync("GameWonByForfeit", new
                {
                    winnerId = winner.Key,
                    winnerName = winner.Value
                });
        }
    }

    /// <summary>
    /// Handle unexpected disconnections (browser close, network loss, etc.)
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectionMap.TryRemove(Context.ConnectionId, out var info))
        {
            var (gameId, userId, username) = info;

            var players = _gamePlayers.GetOrAdd(gameId, _ => new ConcurrentDictionary<int, string>());
            players.TryRemove(userId, out _);

            // Notify remaining players
            await Clients.OthersInGroup(GetGameGroup(gameId))
                .SendAsync("PlayerLeft", new
                {
                    userId,
                    username,
                    reason = "disconnected"
                });

            // Check if only one active player remains → win by forfeit
            if (players.Count == 1)
            {
                var winner = players.First();
                await Clients.Group(GetGameGroup(gameId))
                    .SendAsync("GameWonByForfeit", new
                    {
                        winnerId = winner.Key,
                        winnerName = winner.Value
                    });
            }
        }

        await base.OnDisconnectedAsync(exception);
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

    /// <summary>
    /// Broadcast a rent payment between two players.
    /// </summary>
    public async Task BroadcastRentPaid(int gameId, int fromUserId, int toUserId, int amount, int fromMoneyAfter, int toMoneyAfter)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("RentPaid", new
            {
                fromUserId,
                toUserId,
                amount,
                fromMoneyAfter,
                toMoneyAfter
            });
    }

    /// <summary>
    /// Broadcast a casino/blackjack result.
    /// </summary>
    public async Task BroadcastCasinoResult(int gameId, int userId, int moneyAfter)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("CasinoResult", new
            {
                userId,
                moneyAfter
            });
    }

    /// <summary>
    /// Broadcast a completed trade between two players.
    /// </summary>
    public async Task BroadcastTradeCompleted(int gameId, object tradeDetails)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("TradeCompleted", tradeDetails);
    }

    /// <summary>
    /// Broadcast a property upgrade.
    /// </summary>
    public async Task BroadcastPropertyUpgrade(int gameId, int ownerId, int propertyId, int level, int moneyAfter)
    {
        await Clients.OthersInGroup(GetGameGroup(gameId))
            .SendAsync("PropertyUpgradeChanged", new
            {
                ownerId,
                propertyId,
                level,
                money = moneyAfter
            });
    }

    // === Group name helpers ===
    public static string GetGameGroup(int gameId) => $"game-{gameId}";
    public static string GetLobbyGroup(string code) => $"lobby-{code.ToUpper()}";
}
