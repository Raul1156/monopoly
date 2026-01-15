using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.DTOs;

namespace MonopolyAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShopController : ControllerBase
{
    private readonly MonopolyMySqlDbContext _mySql;

    public ShopController(MonopolyMySqlDbContext mySql)
    {
        _mySql = mySql;
    }

    [HttpGet("products")]
    public async Task<ActionResult<List<ShopProductDto>>> GetProducts()
    {
        var products = await _mySql.Productos
            .AsNoTracking()
            .Where(p => p.Disponible)
            .OrderBy(p => p.Id)
            .ToListAsync();

        return Ok(products.Select(MapProduct).ToList());
    }

    [HttpGet("inventory/{userId:int}")]
    public async Task<ActionResult<List<InventoryItemDto>>> GetInventory(int userId)
    {
        var items = await _mySql.Inventario
            .AsNoTracking()
            .Where(i => i.UsuarioId == userId)
            .Include(i => i.Producto)
            .OrderByDescending(i => i.Equipado)
            .ThenBy(i => i.Id)
            .ToListAsync();

        var result = items
            .Where(i => i.Producto != null)
            .Select(i => new InventoryItemDto
            {
                ProductId = i.ProductoId,
                Name = i.Producto!.Nombre,
                Description = i.Producto.Descripcion ?? string.Empty,
                Category = MapInventoryCategory(i.Producto.Categoria),
                Rarity = MapRarity(i.Producto.Rareza),
                Preview = i.Producto.Preview ?? string.Empty,
                Equipped = i.Equipado,
                Quantity = i.Cantidad
            })
            .ToList();

        return Ok(result);
    }

    private static ShopProductDto MapProduct(MonopolyAPI.Data.MySqlEntities.ProductoEntity p)
    {
        return new ShopProductDto
        {
            Id = p.Id,
            Name = p.Nombre,
            Description = p.Descripcion ?? string.Empty,
            Price = p.Precio,
            Currency = MapCurrency(p.Moneda),
            Category = MapShopCategory(p.Categoria),
            Rarity = MapRarity(p.Rareza),
            Preview = p.Preview ?? string.Empty
        };
    }

    private static string MapCurrency(string? moneda)
    {
        return moneda switch
        {
            "gemas" => "gems",
            _ => "pts"
        };
    }

    private static string MapShopCategory(string? categoria)
    {
        return categoria switch
        {
            "tema" => "theme",
            "avatar" => "avatar",
            _ => "theme"
        };
    }

    private static string MapInventoryCategory(string? categoria)
    {
        return categoria switch
        {
            "tema" => "themes",
            "avatar" => "avatars",
            _ => "themes"
        };
    }

    private static string MapRarity(string? rareza)
    {
        return rareza switch
        {
            "raro" => "rare",
            "epico" => "epic",
            "legendario" => "legendary",
            _ => "common"
        };
    }
}
