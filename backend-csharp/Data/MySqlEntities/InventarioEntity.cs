namespace MonopolyAPI.Data.MySqlEntities;

public class InventarioEntity
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public bool Equipado { get; set; }
    public DateTime FechaCompra { get; set; }

    public UsuarioEntity? Usuario { get; set; }
    public ProductoEntity? Producto { get; set; }
}
