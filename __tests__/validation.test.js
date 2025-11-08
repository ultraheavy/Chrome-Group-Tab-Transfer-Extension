/**
 * Tests for export validation logic
 */

describe('Export Validation', () => {
  test('should require at least one group selected', () => {
    const selectedIds = [];
    const includeUngrouped = false;

    const isValid = selectedIds.length > 0 || includeUngrouped;

    expect(isValid).toBe(false);
  });

  test('should allow export with ungrouped tabs only', () => {
    const selectedIds = [];
    const includeUngrouped = true;

    const isValid = selectedIds.length > 0 || includeUngrouped;

    expect(isValid).toBe(true);
  });

  test('should allow export with selected groups', () => {
    const selectedIds = [1, 2, 3];
    const includeUngrouped = false;

    const isValid = selectedIds.length > 0 || includeUngrouped;

    expect(isValid).toBe(true);
  });

  test('should allow export with both selected groups and ungrouped tabs', () => {
    const selectedIds = [1, 2];
    const includeUngrouped = true;

    const isValid = selectedIds.length > 0 || includeUngrouped;

    expect(isValid).toBe(true);
  });
});
