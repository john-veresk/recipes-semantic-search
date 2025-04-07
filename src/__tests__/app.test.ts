import { helloWorld } from '../app';

describe('App', () => {
  describe('helloWorld', () => {
    it('should log "Hello, World!" message', () => {
      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Call the function
      const result = helloWorld();
      
      // Verify the result
      expect(result).toBe('Hello, World!');
      
      // Verify that console.log was called with the correct message
      expect(consoleSpy).toHaveBeenCalledWith('Hello, World!');
      
      // Restore console.log
      consoleSpy.mockRestore();
    });
  });
}); 