using MonopolyAPI.Data;
using MonopolyAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MonopolyAPI.Services;

public interface IBoardService
{
    void InitializeBoard();
    Task<List<BoardSpace>> GetBoardSpaces();
    Task<List<Property>> GetAllProperties();
    Task<Property?> GetPropertyByPosition(int position);
}

public class BoardService : IBoardService
{
    private readonly MonopolyDbContext _context;

    public BoardService(MonopolyDbContext context)
    {
        _context = context;
    }

    public void InitializeBoard()
    {
        if (_context.BoardSpaces.Any())
            return;

        var properties = new List<Property>
        {
            new() { Id = 1, Name = "Calle San José", Type = PropertyType.Street, Price = 60, RentBase = 2, Color = "brown", Position = 1, HousePrice = 50, MortgageValue = 30 },
            new() { Id = 2, Name = "Calle Juan Ramón Jiménez", Type = PropertyType.Street, Price = 60, RentBase = 4, Color = "brown", Position = 3, HousePrice = 50, MortgageValue = 30 },
            new() { Id = 3, Name = "Estación de San Vicente", Type = PropertyType.Station, Price = 200, RentBase = 25, Color = "black", Position = 5, MortgageValue = 100 },
            new() { Id = 4, Name = "Calle Perú", Type = PropertyType.Street, Price = 100, RentBase = 6, Color = "lightblue", Position = 6, HousePrice = 50, MortgageValue = 50 },
            new() { Id = 5, Name = "Calle Nueva Alicante", Type = PropertyType.Street, Price = 100, RentBase = 6, Color = "lightblue", Position = 8, HousePrice = 50, MortgageValue = 50 },
            new() { Id = 6, Name = "Calle Pintor Picasso", Type = PropertyType.Street, Price = 120, RentBase = 8, Color = "lightblue", Position = 9, HousePrice = 50, MortgageValue = 60 },
            new() { Id = 7, Name = "Calle de La Plata", Type = PropertyType.Street, Price = 140, RentBase = 10, Color = "pink", Position = 11, HousePrice = 100, MortgageValue = 70 },
            new() { Id = 8, Name = "Iberdrola (Eléctrica)", Type = PropertyType.Utility, Price = 150, RentBase = 4, Color = "white", Position = 12, MortgageValue = 75 },
            new() { Id = 9, Name = "Calle del Bronce", Type = PropertyType.Street, Price = 140, RentBase = 10, Color = "pink", Position = 13, HousePrice = 100, MortgageValue = 70 },
            new() { Id = 10, Name = "Calle de Alicante", Type = PropertyType.Street, Price = 160, RentBase = 12, Color = "pink", Position = 14, HousePrice = 100, MortgageValue = 80 },
            new() { Id = 11, Name = "Estación Virgen del Remedio", Type = PropertyType.Station, Price = 200, RentBase = 25, Color = "black", Position = 15, MortgageValue = 100 },
            new() { Id = 12, Name = "Calle de Castelar", Type = PropertyType.Street, Price = 180, RentBase = 14, Color = "orange", Position = 16, HousePrice = 100, MortgageValue = 90 },
            new() { Id = 13, Name = "Calle Relleu", Type = PropertyType.Street, Price = 180, RentBase = 14, Color = "orange", Position = 18, HousePrice = 100, MortgageValue = 90 },
            new() { Id = 14, Name = "Calle de los Postigos", Type = PropertyType.Street, Price = 200, RentBase = 16, Color = "orange", Position = 19, HousePrice = 100, MortgageValue = 100 },
            new() { Id = 15, Name = "Calle San Nicolás", Type = PropertyType.Street, Price = 220, RentBase = 18, Color = "red", Position = 21, HousePrice = 150, MortgageValue = 110 },
            new() { Id = 16, Name = "Calle Juan Bautista", Type = PropertyType.Street, Price = 220, RentBase = 18, Color = "red", Position = 23, HousePrice = 150, MortgageValue = 110 },
            new() { Id = 17, Name = "Calle El Puerto", Type = PropertyType.Street, Price = 240, RentBase = 20, Color = "red", Position = 24, HousePrice = 150, MortgageValue = 120 },
            new() { Id = 18, Name = "Estación Mercado", Type = PropertyType.Station, Price = 200, RentBase = 25, Color = "black", Position = 25, MortgageValue = 100 },
            new() { Id = 19, Name = "Calle Alfonso el Sabio", Type = PropertyType.Street, Price = 260, RentBase = 22, Color = "yellow", Position = 26, HousePrice = 150, MortgageValue = 130 },
            new() { Id = 20, Name = "Calle Federico Soto", Type = PropertyType.Street, Price = 260, RentBase = 22, Color = "yellow", Position = 27, HousePrice = 150, MortgageValue = 130 },
            new() { Id = 21, Name = "Aquea Service (Agua)", Type = PropertyType.Utility, Price = 150, RentBase = 4, Color = "white", Position = 28, MortgageValue = 75 },
            new() { Id = 22, Name = "Calle Canalejas", Type = PropertyType.Street, Price = 280, RentBase = 24, Color = "yellow", Position = 29, HousePrice = 150, MortgageValue = 140 },
            new() { Id = 23, Name = "Calle Costa Blanca", Type = PropertyType.Street, Price = 300, RentBase = 26, Color = "green", Position = 31, HousePrice = 200, MortgageValue = 150 },
            new() { Id = 24, Name = "Calle Oviedo", Type = PropertyType.Street, Price = 300, RentBase = 26, Color = "green", Position = 32, HousePrice = 200, MortgageValue = 150 },
            new() { Id = 25, Name = "Calle José Garberi", Type = PropertyType.Street, Price = 320, RentBase = 28, Color = "green", Position = 34, HousePrice = 200, MortgageValue = 160 },
            new() { Id = 26, Name = "Estación de Muchavista", Type = PropertyType.Station, Price = 200, RentBase = 25, Color = "black", Position = 35, MortgageValue = 100 },
            new() { Id = 27, Name = "Calle Camino del Faro", Type = PropertyType.Street, Price = 350, RentBase = 35, Color = "blue", Position = 37, HousePrice = 200, MortgageValue = 175 },
            new() { Id = 28, Name = "Impuesto de Lujo", Type = PropertyType.Special, Price = 0, RentBase = 100, Color = "white", Position = 38 },
            new() { Id = 29, Name = "Calle Virgen del Carmen", Type = PropertyType.Street, Price = 400, RentBase = 50, Color = "blue", Position = 39, HousePrice = 200, MortgageValue = 200 }
        };

        _context.Properties.AddRange(properties);

        var boardSpaces = new List<BoardSpace>
        {
            new() { Position = 0, Name = "Salida", Type = SpaceType.Go, ActionAmount = 200 },
            new() { Position = 1, Name = "Calle San José", Type = SpaceType.Property, PropertyId = 1 },
            new() { Position = 2, Name = "Hacienda", Type = SpaceType.CommunityChest },
            new() { Position = 3, Name = "Calle Juan Ramón Jiménez", Type = SpaceType.Property, PropertyId = 2 },
            new() { Position = 4, Name = "Impuesto 21%", Type = SpaceType.Tax, ActionAmount = 200 },
            new() { Position = 5, Name = "Estación de San Vicente", Type = SpaceType.Property, PropertyId = 3 },
            new() { Position = 6, Name = "Calle Perú", Type = SpaceType.Property, PropertyId = 4 },
            new() { Position = 7, Name = "Lotería", Type = SpaceType.Chance },
            new() { Position = 8, Name = "Calle Nueva Alicante", Type = SpaceType.Property, PropertyId = 5 },
            new() { Position = 9, Name = "Calle Pintor Picasso", Type = SpaceType.Property, PropertyId = 6 },
            new() { Position = 10, Name = "Cárcel (Visitante)", Type = SpaceType.Jail },
            new() { Position = 11, Name = "Calle de La Plata", Type = SpaceType.Property, PropertyId = 7 },
            new() { Position = 12, Name = "Iberdrola", Type = SpaceType.Property, PropertyId = 8 },
            new() { Position = 13, Name = "Calle del Bronce", Type = SpaceType.Property, PropertyId = 9 },
            new() { Position = 14, Name = "Calle de Alicante", Type = SpaceType.Property, PropertyId = 10 },
            new() { Position = 15, Name = "Estación Virgen del Remedio", Type = SpaceType.Property, PropertyId = 11 },
            new() { Position = 16, Name = "Calle de Castelar", Type = SpaceType.Property, PropertyId = 12 },
            new() { Position = 17, Name = "Hacienda", Type = SpaceType.CommunityChest },
            new() { Position = 18, Name = "Calle Relleu", Type = SpaceType.Property, PropertyId = 13 },
            new() { Position = 19, Name = "Calle de los Postigos", Type = SpaceType.Property, PropertyId = 14 },
            new() { Position = 20, Name = "Casino", Type = SpaceType.FreeParking },
            new() { Position = 21, Name = "Calle San Nicolás", Type = SpaceType.Property, PropertyId = 15 },
            new() { Position = 22, Name = "Lotería", Type = SpaceType.Chance },
            new() { Position = 23, Name = "Calle Juan Bautista", Type = SpaceType.Property, PropertyId = 16 },
            new() { Position = 24, Name = "Calle El Puerto", Type = SpaceType.Property, PropertyId = 17 },
            new() { Position = 25, Name = "Estación Mercado", Type = SpaceType.Property, PropertyId = 18 },
            new() { Position = 26, Name = "Calle Alfonso el Sabio", Type = SpaceType.Property, PropertyId = 19 },
            new() { Position = 27, Name = "Calle Federico Soto", Type = SpaceType.Property, PropertyId = 20 },
            new() { Position = 28, Name = "Aquea Service", Type = SpaceType.Property, PropertyId = 21 },
            new() { Position = 29, Name = "Calle Canalejas", Type = SpaceType.Property, PropertyId = 22 },
            new() { Position = 30, Name = "Ve a la Cárcel", Type = SpaceType.GoToJail },
            new() { Position = 31, Name = "Calle Costa Blanca", Type = SpaceType.Property, PropertyId = 23 },
            new() { Position = 32, Name = "Calle Oviedo", Type = SpaceType.Property, PropertyId = 24 },
            new() { Position = 33, Name = "Hacienda", Type = SpaceType.CommunityChest },
            new() { Position = 34, Name = "Calle José Garberi", Type = SpaceType.Property, PropertyId = 25 },
            new() { Position = 35, Name = "Estación de Muchavista", Type = SpaceType.Property, PropertyId = 26 },
            new() { Position = 36, Name = "Lotería", Type = SpaceType.Chance },
            new() { Position = 37, Name = "Calle Camino del Faro", Type = SpaceType.Property, PropertyId = 27 },
            new() { Position = 38, Name = "Impuesto de Lujo", Type = SpaceType.Luxury, ActionAmount = 100 },
            new() { Position = 39, Name = "Calle Virgen del Carmen", Type = SpaceType.Property, PropertyId = 29 }
        };

        _context.BoardSpaces.AddRange(boardSpaces);
        _context.SaveChanges();
    }

    public async Task<List<BoardSpace>> GetBoardSpaces()
    {
        return await _context.BoardSpaces
            .Include(bs => bs.Property)
            .OrderBy(bs => bs.Position)
            .ToListAsync();
    }

    public async Task<List<Property>> GetAllProperties()
    {
        return await _context.Properties.ToListAsync();
    }

    public async Task<Property?> GetPropertyByPosition(int position)
    {
        var boardSpace = await _context.BoardSpaces
            .Include(bs => bs.Property)
            .FirstOrDefaultAsync(bs => bs.Position == position);

        return boardSpace?.Property;
    }
}
