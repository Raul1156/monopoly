using MonopolyAPI.DTOs;
using System.Collections.Concurrent;

namespace MonopolyAPI.Services;

public interface IGameSessionService
{
    DiceRollDto RollDice();
    MoveResultDto MovePlayer(int currentPosition, DiceRollDto diceRoll, string spaceName);
    int CalculateRent(int propertyId, int houses, bool hasHotel, int utilitiesOwned, int stationsOwned, int diceRoll);
}

public class GameSessionService : IGameSessionService
{
    private readonly Random _random = new();
    private readonly ConcurrentDictionary<int, object> _gameLocks = new();

    public DiceRollDto RollDice()
    {
        var dice1 = _random.Next(1, 7);
        var dice2 = _random.Next(1, 7);

        return new DiceRollDto
        {
            Dice1 = dice1,
            Dice2 = dice2,
            Total = dice1 + dice2,
            IsDouble = dice1 == dice2
        };
    }

    public MoveResultDto MovePlayer(int currentPosition, DiceRollDto diceRoll, string spaceName)
    {
        var newPosition = (currentPosition + diceRoll.Total) % 40;
        var passedGo = newPosition < currentPosition;
        var moneyChange = passedGo ? 200 : 0;

        return new MoveResultDto
        {
            NewPosition = newPosition,
            SpaceName = spaceName,
            SpaceType = GetSpaceType(newPosition),
            DiceRoll = diceRoll,
            PassedGo = passedGo,
            MoneyChange = moneyChange,
            Message = passedGo ? "¡Pasaste por la Salida! +200€" : $"Caíste en {spaceName}"
        };
    }

    public int CalculateRent(int propertyId, int houses, bool hasHotel, int utilitiesOwned, int stationsOwned, int diceRoll)
    {
        // Simplified rent calculation
        if (hasHotel)
            return 200 * (propertyId / 10 + 1);

        if (houses > 0)
            return 50 * houses * (propertyId / 10 + 1);

        if (stationsOwned > 0)
            return 25 * (int)Math.Pow(2, stationsOwned - 1);

        if (utilitiesOwned > 0)
            return diceRoll * (utilitiesOwned == 1 ? 4 : 10);

        return 10 * (propertyId / 5 + 1);
    }

    private static string GetSpaceType(int position)
    {
        return position switch
        {
            0 => "Go",
            10 => "Jail",
            20 => "FreeParking",
            30 => "GoToJail",
            2 or 7 or 17 or 22 or 33 or 36 => "Chance",
            4 or 38 => "Tax",
            _ => "Property"
        };
    }
}
