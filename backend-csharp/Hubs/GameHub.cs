using Microsoft.AspNetCore.SignalR;

namespace MonopolyAPI.Hubs;

public class GameHub : Hub
{
    public Task JoinGame(int gameId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GetGameGroup(gameId));
    }

    public Task LeaveGame(int gameId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGameGroup(gameId));
    }

    public static string GetGameGroup(int gameId) => $"game-{gameId}";
}
