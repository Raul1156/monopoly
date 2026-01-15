using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.DTOs;

namespace MonopolyAPI.Services;

public class MySqlBoardService : IBoardService
{
    private static readonly Regex FirstNumberRegex = new(@"(-?\d+)", RegexOptions.Compiled);

    private readonly MonopolyMySqlDbContext _mySql;

    public MySqlBoardService(MonopolyMySqlDbContext mySql)
    {
        _mySql = mySql;
    }

    public void InitializeBoard()
    {
        // Board is initialized via the MySQL script (casillas/propiedades).
    }

    public async Task<List<BoardSpaceDto>> GetBoardSpaces()
    {
        var casillas = await _mySql.Casillas
            .AsNoTracking()
            .Include(c => c.Propiedad)
            .OrderBy(c => c.Posicion)
            .ToListAsync();

        return casillas.Select(MapCasillaToBoardSpaceDto).ToList();
    }

    public async Task<List<PropertyDto>> GetAllProperties()
    {
        var propiedades = await _mySql.Propiedades
            .AsNoTracking()
            .Include(p => p.Casilla)
            .ToListAsync();

        return propiedades
            .Where(p => p.Casilla != null)
            .Select(MapPropiedadToPropertyDto)
            .OrderBy(p => p.Position)
            .ToList();
    }

    public async Task<PropertyDto?> GetPropertyByPosition(int position)
    {
        var casilla = await _mySql.Casillas
            .AsNoTracking()
            .Include(c => c.Propiedad)
            .FirstOrDefaultAsync(c => c.Posicion == position);

        if (casilla?.Propiedad == null)
            return null;

        return MapPropiedadToPropertyDto(casilla.Propiedad);
    }

    private BoardSpaceDto MapCasillaToBoardSpaceDto(MonopolyAPI.Data.MySqlEntities.CasillaEntity casilla)
    {
        return new BoardSpaceDto
        {
            Id = casilla.Id,
            Name = casilla.Nombre,
            Position = casilla.Posicion,
            Type = casilla.Tipo,
            Description = casilla.Descripcion,
            ActionAmount = TryExtractFirstInt(casilla.Descripcion),
            PropertyId = casilla.Propiedad?.Id,
            Property = casilla.Propiedad != null ? MapPropiedadToPropertyDto(casilla.Propiedad) : null
        };
    }

    private static PropertyDto MapPropiedadToPropertyDto(MonopolyAPI.Data.MySqlEntities.PropiedadEntity propiedad)
    {
        var position = propiedad.Casilla?.Posicion ?? 0;
        var casillaTipo = propiedad.Casilla?.Tipo;

        var type = casillaTipo switch
        {
            "ESTACION" => "Station",
            "COMPANIA" => "Utility",
            "PROPIEDAD" => "Street",
            _ => "Special"
        };

        return new PropertyDto
        {
            Id = propiedad.Id,
            Name = propiedad.Nombre,
            Type = type,
            Price = propiedad.Precio,
            RentBase = propiedad.AlquilerBase,
            Color = propiedad.ColorGrupo ?? string.Empty,
            Position = position
        };
    }

    private static int? TryExtractFirstInt(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        var match = FirstNumberRegex.Match(text);
        if (!match.Success)
            return null;

        return int.TryParse(match.Value, out var value) ? value : null;
    }
}
