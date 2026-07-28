namespace SMS.Api.Tests.Controllers;

using Microsoft.AspNetCore.Mvc;
using Moq;
using SMS.Api.Controllers.Auth;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

public class HostelsControllerTests
{
    private readonly Mock<IHostelService> _mockHostelService;
    private readonly HostelsController _controller;

    public HostelsControllerTests()
    {
        _mockHostelService = new Mock<IHostelService>();
        _controller = new HostelsController(_mockHostelService.Object);
    }

    [Fact]
    public async Task GetDashboardMetrics_ReturnsOkObjectResult_WithMetrics()
    {
        // Arrange
        var expectedMetrics = new HostelDashboardMetricsDto
        {
            TotalHostels = 2,
            TotalRooms = 4,
            TotalBedCapacity = 8,
            OccupiedBeds = 1,
            AvailableVacantBeds = 7,
            HostellerStudents = 1,
            EstMonthlyRevenue = 7500m,
            OccupancyPercentage = 12.5
        };

        _mockHostelService.Setup(s => s.GetExecutiveDashboardMetricsAsync())
            .ReturnsAsync(expectedMetrics);

        // Act
        var result = await _controller.GetDashboardMetrics();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var metrics = Assert.IsType<HostelDashboardMetricsDto>(okResult.Value);
        Assert.Equal(2, metrics.TotalHostels);
        Assert.Equal(8, metrics.TotalBedCapacity);
    }

    [Fact]
    public async Task GetAllHostelBlocks_ReturnsOkObjectResult_WithBlocks()
    {
        // Arrange
        var blocks = new List<HostelBlockDto>
        {
            new() { HostelId = 1, HostelName = "Boys Central Block A", HostelCode = "HST-BOYS-A" }
        };

        _mockHostelService.Setup(s => s.GetAllHostelBlocksAsync(null, null))
            .ReturnsAsync(blocks);

        // Act
        var result = await _controller.GetAllHostelBlocks(null, null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedBlocks = Assert.IsType<List<HostelBlockDto>>(okResult.Value);
        Assert.Single(returnedBlocks);
        Assert.Equal("Boys Central Block A", returnedBlocks[0].HostelName);
    }

    [Fact]
    public async Task CreateHostelBlock_ReturnsCreatedAtAction()
    {
        // Arrange
        var dto = new CreateHostelBlockDto { HostelName = "Boys Central Block A", HostelCode = "HST-535" };
        var created = new HostelBlockDto { HostelId = 10, HostelName = dto.HostelName, HostelCode = dto.HostelCode };

        _mockHostelService.Setup(s => s.CreateHostelBlockAsync(dto))
            .ReturnsAsync(created);

        // Act
        var result = await _controller.CreateHostelBlock(dto);

        // Assert
        var createdAtResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(10, ((HostelBlockDto)createdAtResult.Value!).HostelId);
    }

    [Fact]
    public async Task AllocateBed_ReturnsOkObjectResult_WithAllocation()
    {
        // Arrange
        var dto = new CreateBedAllocationDto { StudentId = 1, HostelId = 1, RoomId = 1, BedNumber = "Bed #1" };
        var createdAlloc = new BedAllocationDto { AllocationId = 5, BedNumber = "Bed #1", Status = "Active" };

        _mockHostelService.Setup(s => s.AllocateBedAsync(dto))
            .ReturnsAsync(createdAlloc);

        // Act
        var result = await _controller.AllocateBed(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var alloc = Assert.IsType<BedAllocationDto>(okResult.Value);
        Assert.Equal(5, alloc.AllocationId);
        Assert.Equal("Active", alloc.Status);
    }
}
