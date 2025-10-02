// CompanySummary.jsx
import React, { useState, useMemo } from 'react';
import {
    Container, Row, Col, Card, Table, Badge, ProgressBar
} from 'react-bootstrap';
import {
    FaTrophy, FaMedal, FaChartBar, FaBuilding, FaUsers
} from 'react-icons/fa6';

const CompanySummary = ({
    detailsData = {},
    personnelBreakdown = [],
    zoneBreakdown = [],
    floorBreakdown = []
}) => {
    const [selectedBuilding, setSelectedBuilding] = useState('all');

    // --- Normalize building from zone ---
    const getBuildingFromZone = (zone) => {
        if (!zone) return null;
        const z = String(zone).toLowerCase();

        // ✅ Map all podium sub-zones
        if (
            z.includes('red zone') ||
            z.includes('yellow zone') ||
            z.includes('green zone') ||
            z.includes('reception')
        ) {
            return 'Podium Floor';
        }

        if (z.includes('2nd')) return '2nd Floor';
        if (z.includes('tower b')) return 'Tower B';

        return null;
    };

    // --- Process company data ---
    // const companyData = useMemo(() => {
    //     const companies = {};
    //     let totalCount = 0;

    //     Object.values(detailsData || {}).forEach(zoneEmployees => {
    //         if (Array.isArray(zoneEmployees)) {
    //             zoneEmployees.forEach(employee => {
    //                 const companyName = employee?.CompanyName || 'Unknown Company';
    //                 const building = getBuildingFromZone(employee?.zone);

    //                 if (!building) return; // ignore unrecognized zones

    //                 if (!companies[companyName]) {
    //                     companies[companyName] = {
    //                         name: companyName,
    //                         total: 0,
    //                         byBuilding: { 'Podium Floor': 0, '2nd Floor': 0, 'Tower B': 0 },
    //                         employees: [],
    //                         locations: new Set()
    //                     };
    //                 }

    //                 companies[companyName].total++;
    //                 companies[companyName].byBuilding[building] =
    //                     (companies[companyName].byBuilding[building] || 0) + 1;

    //                 companies[companyName].employees.push(employee);
    //                 if (employee?.PrimaryLocation) {
    //                     companies[companyName].locations.add(employee.PrimaryLocation);
    //                 }
    //                 totalCount++;
    //             });
    //         }
    //     });

    //     const companyArray = Object.values(companies)
    //         .map(company => ({
    //             ...company,
    //             locations: Array.from(company.locations || []),
    //             percentage: totalCount > 0 ? ((company.total / totalCount) * 100).toFixed(1) : '0.0'
    //         }))
    //         .sort((a, b) => (b.total || 0) - (a.total || 0));

    //     // ✅ Use floorBreakdown directly for totals
    //     const buildingTotals = floorBreakdown.reduce((acc, floor) => {
    //         acc[floor.floor] = floor.total || 0;
    //         return acc;
    //     }, { 'Podium Floor': 0, '2nd Floor': 0, 'Tower B': 0 });

    //     return {
    //         companies: companyArray,
    //         totalCount,
    //         buildingTotals
    //     };
    // }, [detailsData, floorBreakdown]);

    // --- Process company data ---
    const companyData = useMemo(() => {
        const companies = {};
        let totalCount = 0;
        const buildingTotals = { 'Podium Floor': 0, '2nd Floor': 0, 'Tower B': 0 };

        Object.values(detailsData || {}).forEach(zoneEmployees => {
            if (Array.isArray(zoneEmployees)) {
                zoneEmployees.forEach(employee => {
                    const companyName = employee?.CompanyName || 'Unknown Company';
                    const building = getBuildingFromZone(employee?.zone);

                    if (!building) return; // ignore unrecognized zones

                    if (!companies[companyName]) {
                        companies[companyName] = {
                            name: companyName,
                            total: 0,
                            byBuilding: { 'Podium Floor': 0, '2nd Floor': 0, 'Tower B': 0 },
                            employees: [],
                            locations: new Set()
                        };
                    }

                    // Update company totals
                    companies[companyName].total++;
                    companies[companyName].byBuilding[building]++;
                    companies[companyName].employees.push(employee);
                    if (employee?.PrimaryLocation) {
                        companies[companyName].locations.add(employee.PrimaryLocation);
                    }

                    // Update overall totals
                    totalCount++;
                    buildingTotals[building]++;
                });
            }
        });

        const companyArray = Object.values(companies)
            .map(company => ({
                ...company,
                locations: Array.from(company.locations || []),
                percentage: totalCount > 0 ? ((company.total / totalCount) * 100).toFixed(1) : '0.0'
            }))
            .sort((a, b) => (b.total || 0) - (a.total || 0));

        return {
            companies: companyArray,
            totalCount,
            buildingTotals
        };
    }, [detailsData]);
    // --- Filtered companies ---
    const filteredCompanies = useMemo(() => {
        const comps = companyData?.companies || [];
        if (selectedBuilding === 'all') return comps;
        return comps.filter(company => (company.byBuilding?.[selectedBuilding] || 0) > 0);
    }, [companyData?.companies, selectedBuilding]);

    // --- Podium winners ---
    const getPodiumWinners = () => {
        const podiumCompanies = (companyData?.companies || [])
            .filter(c => (c.byBuilding?.['Podium Floor'] || 0) > 0)
            .sort((a, b) => (b.byBuilding?.['Podium Floor'] || 0) - (a.byBuilding?.['Podium Floor'] || 0))
            .reverse()
            .slice(0, 3);

        return podiumCompanies.map((c, idx) => ({
            name: c?.name || 'Unknown',
            count: c?.byBuilding?.['Podium Floor'] || 0,
            position: idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd',
            icon: idx === 0 ? FaTrophy : FaMedal,
            color: idx === 0 ? 'gold' : idx === 1 ? 'silver' : '#cd7f32'
        }));
    };

    const podiumWinners = getPodiumWinners();

    // util
    const safePercent = (num, denom) => (denom > 0 ? (num / denom) * 100 : 0);

    return (
        <Container fluid className="company-summary-dashboard">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="text-warning mb-1">
                                <FaBuilding className="me-2" />
                                Company Analytics Dashboard
                            </h2>
                            <p className="text-light mb-0">
                                Real-time company presence and distribution analysis
                            </p>
                        </div>
                        <Badge bg="warning" text="dark" className="fs-6">
                            <FaUsers className="me-1" />
                            Total: {companyData?.totalCount || 0} People
                        </Badge>
                    </div>
                </Col>
            </Row>

            {/* Stats */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="bg-dark text-light border-success h-100">
                        <Card.Body className="text-center">
                            <FaUsers className="text-success fs-1 mb-2" />
                            <h4 className="text-success">
                                {companyData?.buildingTotals?.['Podium Floor'] || 0}
                            </h4>
                            <p className="mb-0">Podium Floor Occupancy</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="bg-dark text-light border-info h-100">
                        <Card.Body className="text-center">
                            <FaUsers className="text-info fs-1 mb-2" />
                            <h4 className="text-info">
                                {companyData?.buildingTotals?.['2nd Floor'] || 0}
                            </h4>
                            <p className="mb-0">2nd Floor Occupancy</p>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="bg-dark text-light border-warning h-100">
                        <Card.Body className="text-center">
                            <FaUsers className="text-warning fs-1 mb-2" />
                            <h4 className="text-warning">
                                {companyData?.buildingTotals?.['Tower B'] || 0}
                            </h4>
                            <p className="mb-0">Tower B Occupancy</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Company Table */}
            <Row>
                <Col>
                    <Card className="bg-dark text-light border-secondary">
                        <Card.Header className="bg-secondary text-dark">
                            <h4 className="mb-0">
                                <FaChartBar className="me-2" />
                                Company-wise Distribution
                            </h4>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">



                                <Table hover variant="dark" className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Company</th>
                                            <th>Total</th>
                                            <th>Podium Floor</th>
                                            <th>2nd Floor</th>
                                            <th>Tower B</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(filteredCompanies || []).map((company, index) => {
                                            const podiumCount = company?.byBuilding?.['Podium Floor'] || 0;
                                            const secondFloorCount = company?.byBuilding?.['2nd Floor'] || 0;
                                            const towerBCount = company?.byBuilding?.['Tower B'] || 0;

                                            return (
                                                <tr key={company?.name || index}>
                                                    <td>
                                                        <Badge bg={index < 3 ? 'warning' : 'secondary'}>
                                                            #{index + 1}
                                                        </Badge>
                                                    </td>
                                                    <td>{company?.name}</td>
                                                    <td>
                                                        <Badge bg="light" text="dark">{company?.total || 0}</Badge>
                                                    </td>
                                                    <td>{podiumCount > 0 ? <Badge bg="success">{podiumCount}</Badge> : '-'}</td>
                                                    <td>{secondFloorCount > 0 ? <Badge bg="info">{secondFloorCount}</Badge> : '-'}</td>
                                                    <td>{towerBCount > 0 ? <Badge bg="warning">{towerBCount}</Badge> : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                    {/* ✅ Totals Row */}
                                    <tfoot>
                                        <tr className="fw-bold bg-secondary text-dark">
                                            <td colSpan={2} className="text-end">Totals:</td>
                                            <td>
                                                <Badge bg="light" text="dark">
                                                    {companyData?.totalCount || 0}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg="light" text="dark">
                                                    {companyData?.buildingTotals?.['Podium Floor'] || 0}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg="light" text="dark">
                                                    {companyData?.buildingTotals?.['2nd Floor'] || 0}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg="light" text="dark">
                                                    {companyData?.buildingTotals?.['Tower B'] || 0}
                                                </Badge>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </Table>

                            </div>
                            {(filteredCompanies || []).length === 0 && (
                                <div className="text-center text-muted py-4">
                                    No companies found for the selected filter
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};




// Add some custom CSS
const styles = `
.company-summary-dashboard .podium-container {
  min-height: 200px;
}

.company-summary-dashboard .podium-place {
  transition: transform 0.3s ease;
}

.company-summary-dashboard .podium-place:hover {
  transform: translateY(-5px);
}

.company-summary-dashboard .first-place {
  transform: scale(1.1);
}

.company-summary-dashboard .podium-rank {
  padding: 10px;
  border-radius: 8px 8px 0 0;
  text-align: center;
  font-weight: bold;
}

.company-summary-dashboard .podium-company-info {
  padding: 15px;
  background: rgba(255,255,255,0.1);
  border-radius: 0 0 8px 8px;
}

.text-gold { color: #ffd700 !important; }
.text-silver { color: #c0c0c0 !important; }
.text-bronze { color: #cd7f32 !important; }

.bg-bronze {
  background-color: #cd7f32 !important;
  color: white !important;
}

.distribution-bar .progress {
  height: 20px;
  border-radius: 4px;
}

.distribution-bar .progress-bar {
  font-size: 0.7rem;
  font-weight: bold;
}

.bg-gray-700 {
  background-color: #495057 !important;
}

.bg-gray-800 {
  background-color: #343a40 !important;
}
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default CompanySummary;
