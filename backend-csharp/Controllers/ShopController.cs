using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data;
using MonopolyAPI.Data.MySqlEntities;
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

    /// <summary>
    /// Returns all avatar-category products (profile photos).
    /// Auto-creates product entries for any new images found in the fotos-perfil folder.
    /// </summary>
    [HttpGet("profile-photos")]
    public async Task<ActionResult<List<ShopProductDto>>> GetProfilePhotos()
    {
        // Try to scan the fotos-perfil directory and auto-register new images
        var photosPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "fotos-perfil");
        if (Directory.Exists(photosPath))
        {
            var imageExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var files = Directory.GetFiles(photosPath)
                .Where(f => imageExtensions.Contains(Path.GetExtension(f).ToLowerInvariant()))
                .ToList();

            foreach (var file in files)
            {
                var filename = Path.GetFileName(file);
                var exists = await _mySql.Productos
                    .AnyAsync(p => p.Preview == filename && p.Categoria == "avatar");

                if (!exists)
                {
                    var displayName = Path.GetFileNameWithoutExtension(file)
                        .Replace("_", " ").Replace("-", " ");
                    displayName = char.ToUpper(displayName[0]) + displayName[1..];

                    _mySql.Productos.Add(new ProductoEntity
                    {
                        Nombre = displayName,
                        Descripcion = "Foto de perfil exclusiva",
                        Precio = 500,
                        Moneda = "moneda_lobby",
                        Categoria = "avatar",
                        Rareza = "raro",
                        Preview = filename,
                        Disponible = true
                    });
                }
            }
            await _mySql.SaveChangesAsync();
        }

        // Return all avatar products
        var products = await _mySql.Productos
            .AsNoTracking()
            .Where(p => p.Disponible && p.Categoria == "avatar")
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

    /// <summary>
    /// Buy a product: deducts money and adds it to the player's inventory.
    /// </summary>
    [HttpPost("buy")]
    public async Task<ActionResult> BuyProduct([FromBody] BuyProductDto dto)
    {
        var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == dto.UserId);
        if (user == null) return NotFound("Usuario no encontrado");

        var product = await _mySql.Productos.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null) return NotFound("Producto no encontrado");

        // Check if already owned
        var existing = await _mySql.Inventario
            .FirstOrDefaultAsync(i => i.UsuarioId == dto.UserId && i.ProductoId == dto.ProductId);
        if (existing != null) return BadRequest("Ya posees este producto");

        // Check money
        if (user.MonedaLobby < product.Precio)
            return BadRequest("No tienes suficientes puntos");

        // Deduct money
        user.MonedaLobby -= product.Precio;

        // Add to inventory
        _mySql.Inventario.Add(new InventarioEntity
        {
            UsuarioId = dto.UserId,
            ProductoId = dto.ProductId,
            Cantidad = 1,
            Equipado = false,
            FechaCompra = DateTime.UtcNow
        });

        user.ActualizadoEn = DateTime.UtcNow;
        await _mySql.SaveChangesAsync();

        return Ok(new { message = "¡Compra realizada con éxito!", newBalance = user.MonedaLobby });
    }

    /// <summary>
    /// Equip an inventory item. For avatars, also updates the user's avatar field.
    /// Unequips any other item of the same category first.
    /// </summary>
    [HttpPost("equip/{userId:int}/{productId:int}")]
    public async Task<ActionResult> EquipItem(int userId, int productId)
    {
        var inventoryItem = await _mySql.Inventario
            .Include(i => i.Producto)
            .FirstOrDefaultAsync(i => i.UsuarioId == userId && i.ProductoId == productId);

        if (inventoryItem == null) return NotFound("No posees este producto");

        var category = inventoryItem.Producto?.Categoria;

        // Unequip all items in the same category for this user
        var sameCategory = await _mySql.Inventario
            .Include(i => i.Producto)
            .Where(i => i.UsuarioId == userId && i.Equipado && i.Producto!.Categoria == category)
            .ToListAsync();

        foreach (var item in sameCategory)
            item.Equipado = false;

        // Equip the selected item
        inventoryItem.Equipado = true;

        // If it's an avatar, update the user's avatar field
        if (category == "avatar" && inventoryItem.Producto != null)
        {
            var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.Avatar = inventoryItem.Producto.Preview;
                user.ActualizadoEn = DateTime.UtcNow;
            }
        }

        await _mySql.SaveChangesAsync();
        return Ok(new { message = "Item equipado correctamente" });
    }

    /// <summary>
    /// Unequip an inventory item. For avatars, resets to the default avatar.
    /// </summary>
    [HttpPost("unequip/{userId:int}/{productId:int}")]
    public async Task<ActionResult> UnequipItem(int userId, int productId)
    {
        var inventoryItem = await _mySql.Inventario
            .Include(i => i.Producto)
            .FirstOrDefaultAsync(i => i.UsuarioId == userId && i.ProductoId == productId);

        if (inventoryItem == null) return NotFound("No posees este producto");

        inventoryItem.Equipado = false;

        // If it's an avatar, reset to default
        if (inventoryItem.Producto?.Categoria == "avatar")
        {
            var user = await _mySql.Usuarios.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.Avatar = "default";
                user.ActualizadoEn = DateTime.UtcNow;
            }
        }

        await _mySql.SaveChangesAsync();
        return Ok(new { message = "Item desequipado correctamente" });
    }

    // ===== Mapping helpers =====

    private static ShopProductDto MapProduct(ProductoEntity p)
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
        return "pts";
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
