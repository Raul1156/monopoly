namespace MonopolyAPI.Data.MySqlEntities;

public class ProductoEntity
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int Precio { get; set; }
    public string? Moneda { get; set; }
    public string? Categoria { get; set; }
    public string? Rareza { get; set; }
    public string? Preview { get; set; }
    public bool Disponible { get; set; }
}
