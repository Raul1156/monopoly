using MonopolyAPI.Data;
using MonopolyAPI.Models;
using MonopolyAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MonopolyAPI.Services;

public interface IBoardService
{
    void InitializeBoard();
    Task<List<BoardSpaceDto>> GetBoardSpaces();
    Task<List<PropertyDto>> GetAllProperties();
    Task<PropertyDto?> GetPropertyByPosition(int position);
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
        // In-memory board seeding removed: board data must come from MySQL (casillas/propiedades).
    }

    public async Task<List<BoardSpaceDto>> GetBoardSpaces()
    {
        var spaces = await _context.BoardSpaces
            .Include(bs => bs.Property)
            .OrderBy(bs => bs.Position)
            .ToListAsync();

        return spaces.Select(bs => new BoardSpaceDto
        {
            Id = bs.Id,
            Name = bs.Name,
            Position = bs.Position,
            Type = bs.Type.ToString(),
            PropertyId = bs.PropertyId,
            ActionAmount = bs.ActionAmount,
            Property = bs.Property != null
                ? new PropertyDto
                {
                    Id = bs.Property.Id,
                    Name = bs.Property.Name,
                    Type = bs.Property.Type.ToString(),
                    Price = bs.Property.Price,
                    RentBase = bs.Property.RentBase,
                    RentLevel1 = bs.Property.RentWithHouse1,
                    RentLevel2 = bs.Property.RentWithHouse2,
                    RentLevel3 = bs.Property.RentWithHouse3,
                    RentLevel4 = bs.Property.RentWithHouse4,
                    RentHotel = bs.Property.RentWithHotel,
                    UpgradePrice = bs.Property.HousePrice,
                    Color = bs.Property.Color,
                    Position = bs.Property.Position
                }
                : null
        }).ToList();
    }

    public async Task<List<PropertyDto>> GetAllProperties()
    {
        var properties = await _context.Properties.ToListAsync();
        return properties.Select(p => new PropertyDto
        {
            Id = p.Id,
            Name = p.Name,
            Type = p.Type.ToString(),
            Price = p.Price,
            RentBase = p.RentBase,
            RentLevel1 = p.RentWithHouse1,
            RentLevel2 = p.RentWithHouse2,
            RentLevel3 = p.RentWithHouse3,
            RentLevel4 = p.RentWithHouse4,
            RentHotel = p.RentWithHotel,
            UpgradePrice = p.HousePrice,
            Color = p.Color,
            Position = p.Position
        }).ToList();
    }

    public async Task<PropertyDto?> GetPropertyByPosition(int position)
    {
        var boardSpace = await _context.BoardSpaces
            .Include(bs => bs.Property)
            .FirstOrDefaultAsync(bs => bs.Position == position);

        if (boardSpace?.Property == null)
            return null;

        var p = boardSpace.Property;
        return new PropertyDto
        {
            Id = p.Id,
            Name = p.Name,
            Type = p.Type.ToString(),
            Price = p.Price,
            RentBase = p.RentBase,
            RentLevel1 = p.RentWithHouse1,
            RentLevel2 = p.RentWithHouse2,
            RentLevel3 = p.RentWithHouse3,
            RentLevel4 = p.RentWithHouse4,
            RentHotel = p.RentWithHotel,
            UpgradePrice = p.HousePrice,
            Color = p.Color,
            Position = p.Position
        };
    }
}
