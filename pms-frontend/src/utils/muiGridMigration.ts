/**
 * MUI v7 Grid Fix - Apply to all files with Grid errors
 * 
 * Replace pattern:
 * <Grid item xs={12} md={6}> → <Grid item xs={ 12, md: 6 }}>
 * 
 * This file documents the fix pattern for all affected files.
 */

// Example transformations:

// 1. Simple grid item
// OLD: <Grid item xs={12}>
// NEW: <Grid item xs={ 12 }}>

// 2. Responsive grid item  
// OLD: <Grid item xs={12} sm={6} md={4}>
// NEW: <Grid item xs={ 12, sm: 6, md: 4 }}>

// 3. With other props
// OLD: <Grid item xs={12} md={6} key={index}>
// NEW: <Grid item xs={ 12, md: 6 }} key={index}>

// 4. Nested grids
// OLD: <Grid container spacing={2}>
//        <Grid item xs={12}>
// NEW: <Grid container spacing={2}>
//        <Grid item xs={ 12 }}>

/**
 * AFFECTED FILES (58 instances):
 * 
 * - AdminInwardDetailPage.tsx (6 errors)
 * - AdminOutwardDetailPage.tsx (5 errors)  
 * - AdminTransferDetailPage.tsx (5 errors)
 * - DashboardPage.tsx (7 errors)
 * - MaterialDirectoryPage.tsx (7 errors)
 * - ProjectActivityPage.tsx (6 errors)
 * - InwardCreatePage.tsx (11 errors)
 * - InwardDetailPage.tsx (6 errors)
 * - OutwardCreatePage.tsx (4 errors)
 * - TransferCreatePage.tsx (5 errors)
 * - TransferDetailPage.tsx (5 errors)
 * - UserDashboardPage.tsx (10 errors)
 */

export const gridMigrationPattern = {
    from: /item\s+xs=\{(\d+)\}(?:\s+sm=\{(\d+)\})?(?:\s+md=\{(\d+)\})?(?:\s+lg=\{(\d+)\})?/g,
    to: (match: string, xs: string, sm?: string, md?: string, lg?: string) => {
        const sizes: string[] = [`xs: ${xs}`];
        if (sm) sizes.push(`sm: ${sm}`);
        if (md) sizes.push(`md: ${md}`);
        if (lg) sizes.push(`lg: ${lg}`);
        return `size={{ ${sizes.join(', ')} }}`;
    }
};

// Chart legend fix for MUI Charts
// OLD: slotProps={{ legend: { hidden: true } as any }}
// NEW: slotProps={{ legend: { hidden: true } }}
// OR: Remove the 'hidden' prop and use 'position' instead
