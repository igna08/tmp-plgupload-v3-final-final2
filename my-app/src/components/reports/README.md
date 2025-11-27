# Componentes de Reportes

## DownloadReportButton

Componente React reutilizable para descargar reportes en formato PDF desde el backend.

### Uso Básico

```tsx
import DownloadReportButton from '@/components/reports/DownloadReportButton';

// Ejemplo 1: Reporte de activos del último mes
<DownloadReportButton
  reportType="assets"
  preset="month"
/>

// Ejemplo 2: Reporte de incidentes del último trimestre
<DownloadReportButton
  reportType="incidents"
  preset="quarter"
  variant="success"
/>

// Ejemplo 3: Reporte general con rango personalizado
<DownloadReportButton
  reportType="overview"
  startDate="2025-01-01"
  endDate="2025-01-31"
  label="Descargar Reporte de Enero"
/>
```

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `reportType` | `'assets' \| 'incidents' \| 'overview'` | **requerido** | Tipo de reporte a descargar |
| `preset` | `string` | `'month'` | Período predefinido (`today`, `week`, `month`, `quarter`, `year`, `all_time`) |
| `startDate` | `string` | - | Fecha de inicio (formato ISO: `YYYY-MM-DD`) |
| `endDate` | `string` | - | Fecha de fin (formato ISO: `YYYY-MM-DD`) |
| `schoolId` | `string` | - | ID de la escuela (solo para super admin) |
| `className` | `string` | `''` | Clases CSS adicionales |
| `variant` | `'primary' \| 'secondary' \| 'success'` | `'primary'` | Estilo del botón |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del botón |
| `label` | `string` | Auto | Texto del botón |
| `onSuccess` | `() => void` | - | Callback al descargar exitosamente |
| `onError` | `(error: Error) => void` | - | Callback en caso de error |

### Variantes de Estilo

```tsx
// Primario (azul)
<DownloadReportButton reportType="assets" variant="primary" />

// Secundario (gris)
<DownloadReportButton reportType="assets" variant="secondary" />

// Éxito (verde)
<DownloadReportButton reportType="assets" variant="success" />
```

### Tamaños

```tsx
// Pequeño
<DownloadReportButton reportType="assets" size="sm" />

// Mediano (default)
<DownloadReportButton reportType="assets" size="md" />

// Grande
<DownloadReportButton reportType="assets" size="lg" />
```

### Ejemplos Avanzados

#### Con callbacks

```tsx
<DownloadReportButton
  reportType="overview"
  preset="month"
  onSuccess={() => {
    console.log('Reporte descargado exitosamente');
    // Mostrar notificación de éxito
  }}
  onError={(error) => {
    console.error('Error al descargar:', error);
    // Mostrar notificación de error
  }}
/>
```

#### Con escuela específica (Super Admin)

```tsx
<DownloadReportButton
  reportType="assets"
  preset="year"
  schoolId="uuid-de-la-escuela"
  label="Descargar Reporte Anual de Escuela X"
/>
```

#### Personalizado con clases CSS

```tsx
<DownloadReportButton
  reportType="incidents"
  preset="week"
  className="w-full shadow-lg"
  size="lg"
/>
```

### Integración en Página

```tsx
import DownloadReportButton from '@/components/reports/DownloadReportButton';

function ReportsPage() {
  return (
    <div className="p-6">
      <h1>Reportes</h1>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <DownloadReportButton
          reportType="assets"
          preset="month"
          variant="primary"
          label="Activos (Mes)"
        />

        <DownloadReportButton
          reportType="incidents"
          preset="month"
          variant="success"
          label="Incidentes (Mes)"
        />

        <DownloadReportButton
          reportType="overview"
          preset="month"
          variant="secondary"
          label="Reporte General"
        />
      </div>
    </div>
  );
}
```

### Estados

El botón maneja automáticamente:
- ✅ Estado de carga con spinner animado
- ✅ Deshabilitar durante la descarga
- ✅ Cambio de texto a "Descargando..."
- ✅ Autenticación con JWT token
- ✅ Manejo de errores

### Endpoints Utilizados

El componente se conecta a los siguientes endpoints del backend:

- `GET /api/reports/assets/export` - Exportar reporte de activos
- `GET /api/reports/incidents/export` - Exportar reporte de incidentes
- `GET /api/reports/overview/export` - Exportar reporte general

### Notas Importantes

1. **Autenticación**: El componente usa automáticamente el token del contexto `AuthContext`
2. **Formato de archivo**: Todos los reportes se descargan en formato PDF
3. **Nombre de archivo**: Se genera automáticamente con el formato: `reporte-{tipo}-{fecha}.pdf`
4. **Prioridad de fechas**: Si se proporcionan `startDate` y `endDate`, se usan en lugar del `preset`

### Troubleshooting

#### El botón no descarga nada
- Verifica que el usuario esté autenticado
- Revisa la consola del navegador para errores
- Confirma que el backend esté funcionando

#### Error 401 (Unauthorized)
- El token JWT expiró o no es válido
- Redirecciona al usuario al login

#### Error 403 (Forbidden)
- El usuario no tiene permisos para ver reportes
- Verifica los roles y permisos del usuario

#### Error 422 (Validation Error)
- Los parámetros de fecha no son válidos
- Usa formato ISO correcto: `YYYY-MM-DD`
