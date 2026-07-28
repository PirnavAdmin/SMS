namespace SMS.Api.Tests.Services;

using Moq;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

public class HostelServiceTests
{
    private readonly Mock<IHostelRepository> _mockHostelRepo;
    private readonly Mock<ISchoolRepository> _mockSchoolRepo;
    private readonly HostelService _service;

    public HostelServiceTests()
    {
        _mockHostelRepo = new Mock<IHostelRepository>();
        _mockSchoolRepo = new Mock<ISchoolRepository>();
        _service = new HostelService(_mockHostelRepo.Object, _mockSchoolRepo.Object);
    }

    [Fact]
    public async Task CreateHostelBlockAsync_ThrowsException_WhenHostelNameIsEmpty()
    {
        // Arrange
        var dto = new CreateHostelBlockDto { HostelName = "", HostelCode = "HST-01" };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateHostelBlockAsync(dto));
    }

    [Fact]
    public async Task CreateHostelBlockAsync_CreatesAndReturnsDto_WhenValid()
    {
        // Arrange
        var dto = new CreateHostelBlockDto { HostelName = "Girls Block B", HostelCode = "HST-GIRLS", HostelType = "Girls Hostel" };
        _mockHostelRepo.Setup(r => r.AddHostelBlockAsync(It.IsAny<HostelBlock>())).Returns(Task.CompletedTask);
        _mockHostelRepo.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateHostelBlockAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Girls Block B", result.HostelName);
        Assert.Equal("HST-GIRLS", result.HostelCode);
    }

    [Fact]
    public async Task AllocateBedAsync_ThrowsException_WhenRoomIsFull()
    {
        // Arrange
        var dto = new CreateBedAllocationDto { StudentId = 1, HostelId = 1, RoomId = 1, BedNumber = "Bed #3" };
        var student = new AdmissionApplication { Id = 1, FirstName = "Sophia", LastName = "Chen" };
        var hostel = new HostelBlock { HostelId = 1, HostelName = "Block A" };
        var room = new RoomMaster { RoomId = 1, RoomNumber = "101", RoomType = new RoomTypeConfig { BedCapacity = 2 } };

        _mockSchoolRepo.Setup(s => s.GetApplicationByIdAsync(1)).ReturnsAsync(student);
        _mockHostelRepo.Setup(r => r.GetHostelBlockByIdAsync(1)).ReturnsAsync(hostel);
        _mockHostelRepo.Setup(r => r.GetRoomByIdAsync(1)).ReturnsAsync(room);
        _mockHostelRepo.Setup(r => r.GetOccupiedBedCountForRoomAsync(1)).ReturnsAsync(2); // Room capacity 2 is full!

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.AllocateBedAsync(dto));
        Assert.Contains("maximum bed capacity", ex.Message);
    }
}
