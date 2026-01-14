using Microsoft.EntityFrameworkCore;
using MonopolyAPI.Models;

namespace MonopolyAPI.Data;

public class MonopolyDbContext : DbContext
{
    public MonopolyDbContext(DbContextOptions<MonopolyDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<PlayerInGame> PlayersInGame { get; set; }
    public DbSet<Property> Properties { get; set; }
    public DbSet<PropertyOwnership> PropertyOwnerships { get; set; }
    public DbSet<BoardSpace> BoardSpaces { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Game configuration
        modelBuilder.Entity<Game>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Host)
                  .WithMany(u => u.GamesAsHost)
                  .HasForeignKey(e => e.HostUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // PlayerInGame configuration
        modelBuilder.Entity<PlayerInGame>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Game)
                  .WithMany(g => g.Players)
                  .HasForeignKey(e => e.GameId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.PlayerGames)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Property configuration
        modelBuilder.Entity<Property>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        });

        // PropertyOwnership configuration
        modelBuilder.Entity<PropertyOwnership>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.PlayerInGame)
                  .WithMany(p => p.OwnedProperties)
                  .HasForeignKey(e => e.PlayerInGameId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Property)
                  .WithMany()
                  .HasForeignKey(e => e.PropertyId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // BoardSpace configuration
        modelBuilder.Entity<BoardSpace>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Property)
                  .WithMany()
                  .HasForeignKey(e => e.PropertyId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
