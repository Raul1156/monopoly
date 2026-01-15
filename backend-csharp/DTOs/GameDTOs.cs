namespace MonopolyAPI.DTOs;

public class LoginRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public int GamesPlayed { get; set; }
    public int GamesWon { get; set; }
    public int TotalMoney { get; set; }
    public int Gems { get; set; }
    public double TimePlayedHours { get; set; }
    public int Elo { get; set; }
}

public class BoardSpaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Position { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? PropertyId { get; set; }
    public PropertyDto? Property { get; set; }
    public int? ActionAmount { get; set; }
}

public class CreateGameDto
{
    public string Name { get; set; } = string.Empty;
    public int MaxPlayers { get; set; } = 4;
}

public class GameDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int CurrentTurn { get; set; }
    public List<PlayerInGameDto> Players { get; set; } = new();
}

public class PlayerInGameDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int Money { get; set; }
    public int Position { get; set; }
    public bool IsInJail { get; set; }
    public bool IsBankrupt { get; set; }
    public string Token { get; set; } = string.Empty;
    public List<PropertyOwnershipDto> OwnedProperties { get; set; } = new();
}

public class PropertyOwnershipDto
{
    public int PropertyId { get; set; }
    public string PropertyName { get; set; } = string.Empty;
    public int Houses { get; set; }
    public bool HasHotel { get; set; }
    public bool IsMortgaged { get; set; }
}

public class DiceRollDto
{
    public int Dice1 { get; set; }
    public int Dice2 { get; set; }
    public int Total { get; set; }
    public bool IsDouble { get; set; }
}

public class MoveResultDto
{
    public int NewPosition { get; set; }
    public string SpaceName { get; set; } = string.Empty;
    public string SpaceType { get; set; } = string.Empty;
    public DiceRollDto DiceRoll { get; set; } = new();
    public bool PassedGo { get; set; }
    public int MoneyChange { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class BuyPropertyDto
{
    public int GameId { get; set; }
    public int PlayerId { get; set; }
    public int PropertyId { get; set; }
}

public class PropertyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Price { get; set; }
    public int RentBase { get; set; }
    public string Color { get; set; } = string.Empty;
    public int Position { get; set; }
}

public class ShopProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Price { get; set; }
    public string Currency { get; set; } = "pts";
    public string Category { get; set; } = "avatar";
    public string Rarity { get; set; } = "common";
    public string Preview { get; set; } = string.Empty;
}

public class InventoryItemDto
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "avatars";
    public string Rarity { get; set; } = "common";
    public string Preview { get; set; } = string.Empty;
    public bool Equipped { get; set; }
    public int Quantity { get; set; }
}
