namespace Backend.Tests.Services;

using Moq;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Implementations.FinanceManagement;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

public class DynamicFeeStructureServiceTests
{
    private readonly Mock<IFinanceRepository> _repoMock;
    private readonly FinanceService _service;

    public DynamicFeeStructureServiceTests()
    {
        _repoMock = new Mock<IFinanceRepository>();
        _repoMock.Setup(r => r.GetDynamicFeeStructuresAsync())
            .ReturnsAsync(new List<DynamicFeeStructure>());
        _service = new FinanceService(_repoMock.Object);
    }

    [Fact]
    public async Task CreateDynamicFeeStructureAsync_TuitionFee_PersistsWithCategoryAndItems()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Grade 1 Tuition Fee Structure",
            ClassName = "Grade 1",
            AcademicYear = "2026-2027",
            Branch = "Main Branch",
            Category = "Tuition Fee",
            TotalAmount = 40000m,
            Items = new List<FeeStructureItemDto>
            {
                new FeeStructureItemDto
                {
                    FeeHeadId = "1",
                    FeeHeadName = "Term 1 Tuition",
                    Category = "Tuition Fee",
                    Amount = 10000m,
                    Term = "Term 1",
                    ClassName = "Grade 1"
                },
                new FeeStructureItemDto
                {
                    FeeHeadId = "2",
                    FeeHeadName = "Term 2 Tuition",
                    Category = "Tuition Fee",
                    Amount = 10000m,
                    Term = "Term 2",
                    ClassName = "Grade 1"
                }
            }
        };

        _repoMock.Setup(r => r.CreateDynamicFeeStructureAsync(It.IsAny<DynamicFeeStructure>()))
            .ReturnsAsync((DynamicFeeStructure s) =>
            {
                s.Id = 101;
                return s;
            });

        var result = await _service.CreateDynamicFeeStructureAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Grade 1", result.ClassName);
        Assert.Equal("Tuition Fee", result.Category);
        Assert.Equal(2, result.Items?.Count);
        _repoMock.Verify(r => r.CreateDynamicFeeStructureAsync(It.Is<DynamicFeeStructure>(s =>
            s.TargetAudience == "Tuition Fee" &&
            s.ItemsJson != null &&
            s.ItemsJson.Contains("Term 1 Tuition")
        )), Times.Once);
    }

    [Fact]
    public async Task CreateDynamicFeeStructureAsync_OthersFee_PersistsCorrectly()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Sports and Library Fee",
            ClassName = "Grade 5",
            AcademicYear = "2026-2027",
            Branch = "Main Branch",
            Category = "Others",
            TotalAmount = 2500m,
            Items = new List<FeeStructureItemDto>
            {
                new FeeStructureItemDto
                {
                    FeeHeadId = "10",
                    FeeHeadName = "Annual Sports Fee",
                    Category = "Others",
                    Amount = 1500m,
                    Frequency = "Annual"
                },
                new FeeStructureItemDto
                {
                    FeeHeadId = "11",
                    FeeHeadName = "Library Maintenance",
                    Category = "Others",
                    Amount = 1000m,
                    Frequency = "Annual"
                }
            }
        };

        _repoMock.Setup(r => r.CreateDynamicFeeStructureAsync(It.IsAny<DynamicFeeStructure>()))
            .ReturnsAsync((DynamicFeeStructure s) =>
            {
                s.Id = 102;
                return s;
            });

        var result = await _service.CreateDynamicFeeStructureAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Others", result.Category);
        Assert.Equal(2500m, result.TotalAmount);
        _repoMock.Verify(r => r.CreateDynamicFeeStructureAsync(It.Is<DynamicFeeStructure>(s =>
            s.TargetAudience == "Others" &&
            s.ItemsJson != null &&
            s.ItemsJson.Contains("Annual Sports Fee")
        )), Times.Once);
    }

    [Fact]
    public async Task CreateDynamicFeeStructureAsync_HostelFee_PersistsRoomAndSharingDimensions()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Hostel Fee Structure",
            ClassName = "Hostel",
            AcademicYear = "2026-2027",
            Branch = "Main Branch",
            Category = "Hostel",
            TotalAmount = 50000m,
            Items = new List<FeeStructureItemDto>
            {
                new FeeStructureItemDto
                {
                    FeeHeadId = "20",
                    FeeHeadName = "Hostel Fee",
                    Category = "Hostel",
                    Amount = 25000m,
                    HostelBlockId = "1",
                    HostelBlockName = "Block A",
                    RoomId = "101",
                    RoomNo = "A-101",
                    RoomType = "AC",
                    Capacity = 3,
                    SharingType = "3-Bed Sharing",
                    Term = "Term 1"
                }
            }
        };

        _repoMock.Setup(r => r.CreateDynamicFeeStructureAsync(It.IsAny<DynamicFeeStructure>()))
            .ReturnsAsync((DynamicFeeStructure s) =>
            {
                s.Id = 103;
                return s;
            });

        var result = await _service.CreateDynamicFeeStructureAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Hostel", result.Category);
        var item = Assert.Single(result.Items!);
        Assert.Equal("Block A", item.HostelBlockName);
        Assert.Equal("A-101", item.RoomNo);
        Assert.Equal("3-Bed Sharing", item.SharingType);
        _repoMock.Verify(r => r.CreateDynamicFeeStructureAsync(It.Is<DynamicFeeStructure>(s =>
            s.TargetAudience == "Hostel" &&
            s.ItemsJson != null &&
            s.ItemsJson.Contains("3-Bed Sharing")
        )), Times.Once);
    }

    [Fact]
    public async Task CreateDynamicFeeStructureAsync_TransportFee_PersistsRouteAndStopDimensions()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Transport Route 1 Fee",
            ClassName = "Transport",
            AcademicYear = "2026-2027",
            Branch = "Main Branch",
            Category = "Transport",
            TotalAmount = 12000m,
            Items = new List<FeeStructureItemDto>
            {
                new FeeStructureItemDto
                {
                    FeeHeadId = "30",
                    FeeHeadName = "Transport Fee",
                    Category = "Transport",
                    Amount = 6000m,
                    TransportRouteId = "5",
                    RouteName = "North Route",
                    PickupPointId = "12",
                    StopName = "City Center Stop",
                    VehicleId = "3",
                    VehicleNumber = "BUS-04",
                    Term = "Term 1"
                }
            }
        };

        _repoMock.Setup(r => r.CreateDynamicFeeStructureAsync(It.IsAny<DynamicFeeStructure>()))
            .ReturnsAsync((DynamicFeeStructure s) =>
            {
                s.Id = 104;
                return s;
            });

        var result = await _service.CreateDynamicFeeStructureAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Transport", result.Category);
        var item = Assert.Single(result.Items!);
        Assert.Equal("North Route", item.RouteName);
        Assert.Equal("City Center Stop", item.StopName);
        Assert.Equal("BUS-04", item.VehicleNumber);
        _repoMock.Verify(r => r.CreateDynamicFeeStructureAsync(It.Is<DynamicFeeStructure>(s =>
            s.TargetAudience == "Transport" &&
            s.ItemsJson != null &&
            s.ItemsJson.Contains("City Center Stop")
        )), Times.Once);
    }

    [Fact]
    public async Task CreateDynamicFeeStructureAsync_UniformFee_PersistsItemAndSizeDimensions()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Standard Uniform Set",
            ClassName = "Uniform",
            AcademicYear = "2026-2027",
            Branch = "Main Branch",
            Category = "Uniform",
            TotalAmount = 3500m,
            Items = new List<FeeStructureItemDto>
            {
                new FeeStructureItemDto
                {
                    FeeHeadId = "40",
                    FeeHeadName = "Uniform Fee",
                    Category = "Uniform",
                    Amount = 3500m,
                    UniformItemId = "7",
                    UniformItemName = "Formal Blazer and Shirt",
                    UniformCategoryId = "2",
                    UniformCategoryName = "Winter Uniform",
                    UniformSizeId = "4",
                    UniformSizeName = "Medium (M)",
                    Quantity = 1
                }
            }
        };

        _repoMock.Setup(r => r.CreateDynamicFeeStructureAsync(It.IsAny<DynamicFeeStructure>()))
            .ReturnsAsync((DynamicFeeStructure s) =>
            {
                s.Id = 105;
                return s;
            });

        var result = await _service.CreateDynamicFeeStructureAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Uniform", result.Category);
        var item = Assert.Single(result.Items!);
        Assert.Equal("Formal Blazer and Shirt", item.UniformItemName);
        Assert.Equal("Medium (M)", item.UniformSizeName);
        _repoMock.Verify(r => r.CreateDynamicFeeStructureAsync(It.Is<DynamicFeeStructure>(s =>
            s.TargetAudience == "Uniform" &&
            s.ItemsJson != null &&
            s.ItemsJson.Contains("Formal Blazer and Shirt")
        )), Times.Once);
    }

    [Fact]
    public async Task GetDynamicFeeStructuresAsync_SeparatesDistinctCategoriesCorrectly()
    {
        var structures = new List<DynamicFeeStructure>
        {
            new DynamicFeeStructure
            {
                Id = 1,
                Name = "Tuition Grade 1",
                ClassName = "Grade 1",
                AcademicYear = "2026-2027",
                Branch = "Main Branch",
                TargetAudience = "Tuition Fee",
                ItemsJson = JsonSerializer.Serialize(new[]
                {
                    new FeeStructureItemDto { FeeHeadId = "1", FeeHeadName = "Tuition", Amount = 15000m }
                })
            },
            new DynamicFeeStructure
            {
                Id = 2,
                Name = "Hostel Facility 2026",
                ClassName = "Hostel",
                AcademicYear = "2026-2027",
                Branch = "Main Branch",
                TargetAudience = "Hostel",
                ItemsJson = JsonSerializer.Serialize(new[]
                {
                    new FeeStructureItemDto { FeeHeadId = "2", FeeHeadName = "Hostel Fee", Amount = 30000m, HostelBlockName = "Block B" }
                })
            }
        };

        _repoMock.Setup(r => r.GetDynamicFeeStructuresAsync()).ReturnsAsync(structures);

        var all = await _service.GetDynamicFeeStructuresAsync();
        var allList = all.ToList();

        Assert.Equal(2, allList.Count);
        Assert.Contains(allList, s => s.Category == "Tuition Fee" && s.ClassName == "Grade 1");
        Assert.Contains(allList, s => s.Category == "Hostel" && s.Items?.Any(i => i.HostelBlockName == "Block B") == true);
    }

    [Fact]
    public async Task GetDynamicFeeStructuresAsync_WhenFeeHeadDeleted_FiltersOutOrphanItemsAndUpdatesTotal()
    {
        // Fee head with ID 1 exists, but Fee head with ID 2 was deleted
        var activeFeeHeads = new List<FeeHead>
        {
            new FeeHead { Id = 1, Name = "Tuition Fee", Category = "Tuition", DefaultAmount = 15000m }
        };
        _repoMock.Setup(r => r.GetFeeHeadsAsync()).ReturnsAsync(activeFeeHeads);

        var structures = new List<DynamicFeeStructure>
        {
            new DynamicFeeStructure
            {
                Id = 1,
                Name = "Grade 1 Tuition Fee Structure",
                ClassName = "Grade 1",
                AcademicYear = "2026-2027",
                Branch = "Main Branch",
                TargetAudience = "Tuition Fee",
                TotalAmount = 25000m,
                ItemsJson = JsonSerializer.Serialize(new[]
                {
                    new FeeStructureItemDto { FeeHeadId = "1", FeeHeadName = "Tuition Fee", Amount = 15000m },
                    new FeeStructureItemDto { FeeHeadId = "2", FeeHeadName = "Deleted Books Fee", Amount = 10000m }
                })
            }
        };

        _repoMock.Setup(r => r.GetDynamicFeeStructuresAsync()).ReturnsAsync(structures);

        var all = await _service.GetDynamicFeeStructuresAsync();
        var allList = all.ToList();

        Assert.Single(allList);
        var s = allList[0];
        Assert.Single(s.Items);
        Assert.Equal("1", s.Items[0].FeeHeadId);
        Assert.Equal(15000m, s.TotalAmount);
    }

    [Fact]
    public async Task DeleteFeeHeadAsync_DelegatesToRepository()
    {
        _repoMock.Setup(r => r.DeleteFeeHeadAsync(1)).Returns(Task.CompletedTask);

        await _service.DeleteFeeHeadAsync(1);

        _repoMock.Verify(r => r.DeleteFeeHeadAsync(1), Times.Once);
    }

    [Fact]
    public async Task DeleteDynamicFeeStructureAsync_DelegatesToRepository()
    {
        _repoMock.Setup(r => r.DeleteDynamicFeeStructureAsync(101)).Returns(Task.CompletedTask);

        await _service.DeleteDynamicFeeStructureAsync(101);

        _repoMock.Verify(r => r.DeleteDynamicFeeStructureAsync(101), Times.Once);
    }

    [Fact]
    public async Task GetStudentFeeAssignmentsAsync_WhenFeeStructureDeleted_FiltersOrphanAssignments()
    {
        var assignments = new List<StudentFeeAssignment>
        {
            new StudentFeeAssignment
            {
                Id = 1,
                StudentId = "327",
                DynamicFeeStructureId = 999, // Structure does not exist
                TotalAmount = 25000m,
                DueAmount = 25000m
            }
        };

        _repoMock.Setup(r => r.GetStudentFeeAssignmentsAsync()).ReturnsAsync(assignments);
        _repoMock.Setup(r => r.GetDynamicFeeStructuresAsync()).ReturnsAsync(new List<DynamicFeeStructure>());
        _repoMock.Setup(r => r.DeleteStudentFeeAssignmentAsync(1)).Returns(Task.CompletedTask);

        var result = await _service.GetStudentFeeAssignmentsAsync();

        Assert.Empty(result);
        _repoMock.Verify(r => r.DeleteStudentFeeAssignmentAsync(1), Times.Once);
    }
}
