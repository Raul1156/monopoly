namespace MonopolyAPI.DTOs;

public class CardDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // COMUNIDAD | SUERTE
    public string Description { get; set; } = string.Empty;
    public string Effect { get; set; } = string.Empty; // ganar_dinero | perder_dinero | cobrar_jugadores | pagar_jugadores
    public int Value { get; set; }
}

public class CardDrawDto
{
    public CardDto Card { get; set; } = new();
}

public class PlayerMoneyDeltaDto
{
    public int PlayerId { get; set; }
    public int Delta { get; set; }
    public int NewMoney { get; set; }
    public bool IsBankrupt { get; set; }
}

public class ApplyCardResultDto
{
    public CardDto Card { get; set; } = new();
    public int GameId { get; set; }
    public int TriggerPlayerId { get; set; }
    public List<PlayerMoneyDeltaDto> MoneyDeltas { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
