# Universal Loading Component Usage Guide

The `UniversalLoading` component provides a standardized loading experience across the entire application using your favicon with elegant glare effects.

## Features

- **Favicon-based**: Uses your favicon.png with rotating ring and glare effects
- **Contextual messages**: Automatically detects page type and shows appropriate loading message
- **Multiple sizes**: Small, medium, and large variants
- **Progress bar**: Optional progress indicator
- **Overlay modes**: Full overlay or inline display
- **Responsive**: Works on all screen sizes

## Basic Usage

### Import the component
```tsx
import { UniversalLoading } from '@/components/universal-loading';
```

### Simple loading state
```tsx
// Full screen overlay with contextual message
if (loading) {
  return <UniversalLoading isLoading={true} />;
}
```

### Custom message
```tsx
<UniversalLoading 
  isLoading={true} 
  message="Loading training data..." 
/>
```

### Inline loading (no overlay)
```tsx
<UniversalLoading 
  isLoading={true} 
  overlay={false} 
  size="sm" 
/>
```

### With progress bar
```tsx
<UniversalLoading 
  isLoading={true} 
  showProgress={true}
  message="Importing participants..."
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | boolean | false | Whether to show the loading indicator |
| `message` | string | auto-detected | Custom loading message |
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Size of the favicon |
| `showProgress` | boolean | false | Show animated progress bar |
| `overlay` | boolean | true | Show as full screen overlay |

## Contextual Messages

The component automatically detects the current page and shows appropriate messages:

- Training pages: "Loading training sessions...", "Loading participants...", etc.
- School pages: "Loading schools..."
- User pages: "Loading users..."
- Analytics: "Loading analytics..."
- Default: "Loading..."

## Migration from Old Loading Patterns

### Replace old spinner patterns:
```tsx
// OLD
<div className="flex items-center justify-center h-64">
  <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
  <p>Loading...</p>
</div>

// NEW
<UniversalLoading isLoading={true} overlay={false} />
```

### Replace loading functions:
```tsx
// OLD
function Loading() {
  return (
    <div className="text-center py-8">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
      <p>Loading...</p>
    </div>
  );
}

// NEW
function Loading() {
  return <UniversalLoading isLoading={true} overlay={false} />;
}
```

## Examples in Context

### Page-level loading
```tsx
function TrainingSessionsPage() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <UniversalLoading isLoading={true} />;
  }
  
  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

### Component-level loading
```tsx
function DataTable() {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="relative">
      {loading && (
        <UniversalLoading 
          isLoading={true} 
          overlay={false} 
          size="sm"
        />
      )}
      <table>
        {/* Table content */}
      </table>
    </div>
  );
}
```

### Suspense fallback
```tsx
export default function App() {
  return (
    <Suspense fallback={<UniversalLoading isLoading={true} />}>
      <MyComponent />
    </Suspense>
  );
}
```

## Visual Design

The component features:
- **Favicon**: Your colorful logo as the central element
- **Rotating ring**: Blue and purple gradient border that spins around the favicon
- **Glare effect**: Subtle white overlay that pulses
- **Sweep animation**: Light sweep that moves across the favicon
- **Pulsing dots**: Three dots below the favicon
- **Progress bar**: Optional gradient progress indicator
- **Backdrop**: Subtle blur overlay when in overlay mode

## Performance Notes

- Only renders when `isLoading` is true
- Automatically cleans up animations when unmounted
- Uses CSS animations for smooth performance
- Minimal bundle impact with tree-shaking