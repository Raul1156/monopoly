using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Data.MySqlEntities;

namespace MonopolyAPI.Data;

public class MonopolyMySqlDbContext : DbContext
{
    public MonopolyMySqlDbContext(DbContextOptions<MonopolyMySqlDbContext> options)
        : base(options)
    {
    }

    public DbSet<UsuarioEntity> Usuarios => Set<UsuarioEntity>();
    public DbSet<CasillaEntity> Casillas => Set<CasillaEntity>();
    public DbSet<PropiedadEntity> Propiedades => Set<PropiedadEntity>();
    public DbSet<ProductoEntity> Productos => Set<ProductoEntity>();
    public DbSet<InventarioEntity> Inventario => Set<InventarioEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UsuarioEntity>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Avatar).HasColumnName("avatar").HasMaxLength(100);
            entity.Property(e => e.Color).HasColumnName("color").HasMaxLength(20);
            entity.Property(e => e.Elo).HasColumnName("elo");
            entity.Property(e => e.MonedaLobby).HasColumnName("moneda_lobby");
            entity.Property(e => e.Gemas).HasColumnName("gemas");
            entity.Property(e => e.Nivel).HasColumnName("nivel");
            entity.Property(e => e.Experiencia).HasColumnName("experiencia");
            entity.Property(e => e.PartidasJugadas).HasColumnName("partidas_jugadas");
            entity.Property(e => e.PartidasGanadas).HasColumnName("partidas_ganadas");
            entity.Property(e => e.Activo).HasColumnName("activo");
            entity.Property(e => e.UltimoLogin).HasColumnName("ultimo_login");
            entity.Property(e => e.CreadoEn).HasColumnName("creado_en");
            entity.Property(e => e.ActualizadoEn).HasColumnName("actualizado_en");

            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<CasillaEntity>(entity =>
        {
            entity.ToTable("casillas");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Posicion).HasColumnName("posicion").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.HasIndex(e => e.Posicion).IsUnique();
        });

        modelBuilder.Entity<PropiedadEntity>(entity =>
        {
            entity.ToTable("propiedades");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CasillaId).HasColumnName("casilla_id").IsRequired();
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Precio).HasColumnName("precio").IsRequired();
            entity.Property(e => e.AlquilerBase).HasColumnName("alquiler_base").IsRequired();
            entity.Property(e => e.AlquilerNivel1).HasColumnName("alquiler_nivel_1");
            entity.Property(e => e.AlquilerNivel2).HasColumnName("alquiler_nivel_2");
            entity.Property(e => e.AlquilerNivel3).HasColumnName("alquiler_nivel_3");
            entity.Property(e => e.PrecioMejora).HasColumnName("precio_mejora");
            entity.Property(e => e.ColorGrupo).HasColumnName("color_grupo").HasMaxLength(50);

            entity.HasOne(e => e.Casilla)
                .WithOne(c => c.Propiedad)
                .HasForeignKey<PropiedadEntity>(e => e.CasillaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductoEntity>(entity =>
        {
            entity.ToTable("productos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Precio).HasColumnName("precio").IsRequired();
            entity.Property(e => e.Moneda).HasColumnName("moneda").HasMaxLength(20);
            entity.Property(e => e.Categoria).HasColumnName("categoria").HasMaxLength(20);
            entity.Property(e => e.Rareza).HasColumnName("rareza").HasMaxLength(20);
            entity.Property(e => e.Preview).HasColumnName("preview").HasMaxLength(255);
            entity.Property(e => e.Disponible).HasColumnName("disponible");
        });

        modelBuilder.Entity<InventarioEntity>(entity =>
        {
            entity.ToTable("inventario");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.ProductoId).HasColumnName("producto_id").IsRequired();
            entity.Property(e => e.Cantidad).HasColumnName("cantidad");
            entity.Property(e => e.Equipado).HasColumnName("equipado");
            entity.Property(e => e.FechaCompra).HasColumnName("fecha_compra");

            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Producto)
                .WithMany()
                .HasForeignKey(e => e.ProductoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

    }
}
