namespace MonopolyAPI.Models;

public class Property
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public PropertyType Type { get; set; }
    public int Price { get; set; }
    public int RentBase { get; set; }
    public int RentWithHouse1 { get; set; }
    public int RentWithHouse2 { get; set; }
    public int RentWithHouse3 { get; set; }
    public int RentWithHouse4 { get; set; }
    public int RentWithHotel { get; set; }
    public int HousePrice { get; set; }
    public int HotelPrice { get; set; }
    public string Color { get; set; } = string.Empty;
    public int Position { get; set; }
    public int? MortgageValue { get; set; }
}

public enum PropertyType
{
    Street,
    Station,
    Utility,
    Special
}
