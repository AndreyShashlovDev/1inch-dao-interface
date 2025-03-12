'use strict'
// import { it, expect, describe } from 'vitest';
// import { BigMath } from './big-math';
//
// describe('BigMath', () => {
//
//   it('dev', () => {
//     expect(BigMath.div(
//       2368452n,
//       23651n,
//       11,
//       5,
//       3
//     )).toBe(0n)
//
//     expect(BigMath.div(
//       2368452n,
//       23651n,
//       11,
//       5,
//       8
//     )).toBe(10014n)
//
//     expect(BigMath.div(
//       123456n,
//       7899999n,
//       8,
//       18,
//       2
//     )).toBe(15627343750n)
//
//     expect(() => BigMath.div(
//       20n,
//       0n,
//       2,
//       2)
//     ).toThrow(Error);
//   })
//
//   it('mul', () => {
//     expect(BigMath.mul(
//       2368452n,
//       23651n,
//       11,
//       5,
//       3
//     )).toBe(0n)
//
//     expect(BigMath.mul(
//       2368452n,
//       23651n,
//       11,
//       5,
//       8
//     )).toBe(560n)
//
//     expect(BigMath.mul(
//       123456n,
//       7899999n,
//       8,
//       18,
//       24
//     )).toBe(9753022765n)
//
//     expect(BigMath.mul(
//       0n,
//       7899999n,
//       8,
//       18,
//       24
//     )).toBe(0n)
//
//     expect(BigMath.mul(
//       123456n,
//       0n,
//       8,
//       18,
//       24
//     )).toBe(0n)
//
//     expect(BigMath.mul(
//       1000000n,
//       261n,
//       6,
//       6,
//       18
//     )).toBe(261000000000000n)
//   })
//
//   it('add', () => {
//     expect(BigMath.add(
//       2368452n,
//       23651n,
//       11,
//       5,
//       3
//     )).toBe(236n)
//
//     expect(BigMath.add(
//       2368452n,
//       23651n,
//       11,
//       5,
//       8
//     )).toBe(23653368n)
//
//     expect(BigMath.add(
//       123456n,
//       7899999n,
//       8,
//       18,
//       24
//     )).toBe(1234560007899999000000n)
//
//     expect(BigMath.add(
//       0n,
//       7899999n,
//       8,
//       18,
//       24
//     )).toBe(7899999000000n)
//
//     expect(BigMath.add(
//       123456n,
//       0n,
//       8,
//       18,
//       24
//     )).toBe(1234560000000000000000n)
//   })
//
//   it('sub', () => {
//     expect(BigMath.sub(
//       2368452n,
//       23651n,
//       11,
//       5,
//       3
//     )).toBe(-236n)
//
//     expect(BigMath.sub(
//       2368452n,
//       23651n,
//       11,
//       5,
//       8
//     )).toBe(-23648631n)
//
//     expect(BigMath.sub(
//       123456n,
//       7899999n,
//       8,
//       18,
//       24
//     )).toBe(1234559992100001000000n)
//
//     expect(BigMath.sub(
//       0n,
//       7899999n,
//       8,
//       18,
//       24
//     )).toBe(-7899999000000n)
//
//     expect(BigMath.sub(
//       123456n,
//       0n,
//       8,
//       18,
//       24
//     )).toBe(1234560000000000000000n)
//   });
//
//   it('avr', () => {
//     expect(BigMath.avr([
//       100n,
//       100n,
//       100n,
//     ], 10, 8)).toBe(1n)
//     expect(BigMath.avr([
//       100n,
//       100n,
//       100n,
//     ], 2, 8)).toBe(100000000n)
//     expect(BigMath.avr([
//       100n,
//       100n,
//       100n,
//     ], 2)).toBe(100n)
//     expect(BigMath.avr([
//       100n,
//       100n,
//       100n,
//     ], 0)).toBe(100n)
//   })
//
//   it('pow', () => {
//     expect(BigMath.pow(
//       123456n,
//       0,
//       8,
//       18
//     )).toBe(1000000000000000000n)
//
//     expect(BigMath.pow(
//       123456n,
//       2,
//       8,
//       18,
//     )).toBe(152413839360000000000n)
//   })
//
//   it('min', () => {
//     expect(BigMath.min(
//       1n, 2n, 3n, 4n,
//     )).toBe(1n)
//   })
//
//   it('max', () => {
//     expect(BigMath.max(
//       1n, 2n, 3n, 4n,
//     )).toBe(4n)
//   })
//
// })
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmlnLW1hdGguc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJpZy1tYXRoLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlEQUFpRDtBQUNqRCx3Q0FBd0M7QUFDeEMsRUFBRTtBQUNGLDhCQUE4QjtBQUM5QixFQUFFO0FBQ0Ysc0JBQXNCO0FBQ3RCLDBCQUEwQjtBQUMxQixrQkFBa0I7QUFDbEIsZ0JBQWdCO0FBQ2hCLFlBQVk7QUFDWixXQUFXO0FBQ1gsVUFBVTtBQUNWLGtCQUFrQjtBQUNsQixFQUFFO0FBQ0YsMEJBQTBCO0FBQzFCLGtCQUFrQjtBQUNsQixnQkFBZ0I7QUFDaEIsWUFBWTtBQUNaLFdBQVc7QUFDWCxVQUFVO0FBQ1Ysc0JBQXNCO0FBQ3RCLEVBQUU7QUFDRiwwQkFBMEI7QUFDMUIsaUJBQWlCO0FBQ2pCLGtCQUFrQjtBQUNsQixXQUFXO0FBQ1gsWUFBWTtBQUNaLFVBQVU7QUFDViw0QkFBNEI7QUFDNUIsRUFBRTtBQUNGLGdDQUFnQztBQUNoQyxhQUFhO0FBQ2IsWUFBWTtBQUNaLFdBQVc7QUFDWCxXQUFXO0FBQ1gsd0JBQXdCO0FBQ3hCLE9BQU87QUFDUCxFQUFFO0FBQ0Ysc0JBQXNCO0FBQ3RCLDBCQUEwQjtBQUMxQixrQkFBa0I7QUFDbEIsZ0JBQWdCO0FBQ2hCLFlBQVk7QUFDWixXQUFXO0FBQ1gsVUFBVTtBQUNWLGtCQUFrQjtBQUNsQixFQUFFO0FBQ0YsMEJBQTBCO0FBQzFCLGtCQUFrQjtBQUNsQixnQkFBZ0I7QUFDaEIsWUFBWTtBQUNaLFdBQVc7QUFDWCxVQUFVO0FBQ1Ysb0JBQW9CO0FBQ3BCLEVBQUU7QUFDRiwwQkFBMEI7QUFDMUIsaUJBQWlCO0FBQ2pCLGtCQUFrQjtBQUNsQixXQUFXO0FBQ1gsWUFBWTtBQUNaLFdBQVc7QUFDWCwyQkFBMkI7QUFDM0IsRUFBRTtBQUNGLDBCQUEwQjtBQUMxQixZQUFZO0FBQ1osa0JBQWtCO0FBQ2xCLFdBQVc7QUFDWCxZQUFZO0FBQ1osV0FBVztB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
