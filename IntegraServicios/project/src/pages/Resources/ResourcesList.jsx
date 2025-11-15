import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Loader from '../../components/common/Loader';
import { getResources } from '../../api/resources';
import { getResourceTypes } from '../../api/resourceTypes';
import './ResourcesList.css';

const ResourcesList = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    typeId: '',
    search: '',
    available: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadResources();
  }, [filters]);

  const loadData = async () => {
    const typesRes = await getResourceTypes();
    if (typesRes.success) {
      setResourceTypes(typesRes.data);
    }
    loadResources();
  };

  const loadResources = async () => {
    setLoading(true);
    const response = await getResources(filters);
    if (response.success) {
      setResources(response.data);
    }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const typeOptions = resourceTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  return (
    <div className="resources-page">
      <div className="page-header">
        <h1 className="page-title">Recursos Disponibles</h1>
        <p className="page-subtitle">Explora y reserva los recursos que necesitas</p>
      </div>

      <Card className="filters-card">
        <div className="filters-grid">
          <Input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Buscar por nombre..."
          />

          <Select
            name="typeId"
            value={filters.typeId}
            onChange={handleFilterChange}
            options={typeOptions}
            placeholder="Todos los tipos"
          />
        </div>
      </Card>

      {loading ? (
        <div className="loader-container">
          <Loader size="large" />
        </div>
      ) : (
        <div className="resources-grid">
          {resources.length === 0 ? (
            <Card>
              <p className="empty-message">No se encontraron recursos</p>
            </Card>
          ) : (
            resources.map((resource) => (
              <Card key={resource.id} className="resource-card">
                <div className="resource-image-container">
                  <img
                    src={resource.photoUrl}
                    alt={resource.name}
                    className="resource-image"
                  />
                </div>
                <div className="resource-content">
                  <h3 className="resource-name">{resource.name}</h3>
                  <p className="resource-type">{resource.typeName}</p>
                  <p className="resource-description">{resource.description}</p>
                  {resource.capacity && (
                    <p className="resource-capacity">Capacidad: {resource.capacity} personas</p>
                  )}
                  <Button
                    onClick={() => navigate(`/app/resources/${resource.id}/reserve`)}
                    fullWidth
                    disabled={!resource.available}
                  >
                    {resource.available ? 'Reservar' : 'No Disponible'}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ResourcesList;
