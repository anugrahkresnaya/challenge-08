const { User, Role } = require('../models');
const AuthenticationController = require('./AuthenticationController');

describe("AuthenticationController", () => {
  describe("#handleGetUser", () => {
    it("should return res.status(200) and res.json with user data", async () => {
      const email = "abc@gmail.com";

      const mockRequest = {
        user: {
          id: 1,
          roleId: 1,
        },
      };

      const mockUser = new User({ email })
      const mockUserModel = {
        findByPk: jest.fn().mockReturnValue(mockUser),
      };

      const mockRole = new Role();
      const mockRoleModel = {
        findByPk: jest.fn().mockReturnValue(mockRole),
      }

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const authController = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRoleModel,
      });
      await authController.handleGetUser(mockRequest, mockResponse);

      expect(mockUserModel.findByPk).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    })
  });
});
