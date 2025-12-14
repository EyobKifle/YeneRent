# Layout Issues After Login

## Header Issues
- Header is positioned correctly at top with fixed positioning, but ensure it remains horizontal and spans full width
- Check if header elements are aligned properly (left: toggle button, center: title, right: menus)

## Main Body Layout Responsiveness
- Sidebar toggle affects main content width - when sidebar is open, main content should have margin-left: var(--sidebar-width)
- When sidebar is closed/collapsed, main content should have margin-left: 0 or minimal margin
- Ensure smooth transitions when toggling sidebar
- Main content should flex to fill remaining space responsively

## CSS Conflicts
- Layout.css uses grid for .app-layout but sidebar is fixed positioned, causing potential conflicts
- .main-content has margin-left, but when sidebar collapsed, margin should adjust
- CSS selectors for collapsed state may not match (e.g., .app-layout.sidebar-collapsed .main-content)

## Files to Check
- src/components/layout/Layout.jsx - structure and class names
- src/components/layout/Layout.css - grid/flex conflicts, margin adjustments
- src/components/layout/InSystemHeader.css - header positioning
- src/Sidebar.css - sidebar positioning and collapse behavior
- src/styles/partials/_variables.css - CSS variables like --sidebar-width

## Next Steps
- Fix CSS selectors for sidebar collapsed state
- Adjust main content margin based on sidebar state
- Ensure responsive behavior on different screen sizes
- Test sidebar toggle functionality
