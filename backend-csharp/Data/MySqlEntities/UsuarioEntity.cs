namespace MonopolyAPI.Data.MySqlEntities;

public class UsuarioEntity
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Color { get; set; }
    public int Elo { get; set; }
    public int MonedaLobby { get; set; }
    public int Gemas { get; set; }
    public int Nivel { get; set; }
    public int Experiencia { get; set; }
    public int PartidasJugadas { get; set; }
    public int PartidasGanadas { get; set; }
    public bool Activo { get; set; }
    public DateTime? UltimoLogin { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
}
