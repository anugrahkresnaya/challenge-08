const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AuthenticationController = require('./AuthenticationController');
const { InsufficientAccessError, EmailNotRegisteredError } = require('../errors');

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
    });
  });

  describe("#authorize", () => {
    it("should run the next function", async () => {
      const roleModel = Role;
      const userModel = User;
      const authController = new AuthenticationController({
        roleModel, userModel, bcrypt, jwt,
      })

      const mockUser = {
        id: 1,
        name: 'user',
        email: 'user@gmail.com',
        password: 'user123',
        image: 'image.png',
        roleId: 1,
      }

      const mockRole = {
        id: 1,
        name: 'member'
      }

      const mockToken = authController.createTokenFromUser(mockUser, mockRole);

      const mockRequest = {
        headers: {
          authorization: 'Bearer ' + mockToken,
        },
      };

      const mockNext = jest.fn();

      const auth = authController.authorize('member');
      auth(mockRequest, {}, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should call res.status(401) with insufficient access error", async () => {
      const roleModel = Role;
      const userModel = User;
      const authController = new AuthenticationController({
        roleModel, userModel, bcrypt, jwt,
      })

      const mockUser = {
        id: 1,
        name: 'user',
        email: 'user@gmail.com',
        password: 'user123',
        image: 'image.png',
        roleId: 1,
      }

      const mockRole = {
        id: 1,
        name: 'member'
      }

      const mockToken = authController.createTokenFromUser(mockUser, mockRole);

      const mockRequest = {
        headers: {
          authorization: 'Bearer ' + mockToken,
        },
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockNext = jest.fn();

      const auth = authController.authorize('admin');
      auth(mockRequest, mockResponse, mockNext);

      const err = new InsufficientAccessError('member');

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          name: err.name,
          message: err.message,
          details: err.details || null,
        }
      })
    });
  });

  describe("#handleLogin", () => {
    it("should call res.status(201) and return access token", async () => {
      const email = "user@gmail.com";
      const password = "user123";
      const encryptedPassword = bcrypt.hashSync('user123', 10);

      const mockRequest = {
        body: {
          email,
          password,
        },
      };

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const mockNext = jest.fn();

      const mockUser = {
        id: 1,
        name: 'user',
        email: 'user@gmail.com',
        encryptedPassword: encryptedPassword,
        roleId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRole = {
        id: 1,
        name: 'member'
      }

      const mockUserModel = {
        findOne: jest.fn().mockReturnValue({
          ...mockUser,
          Role: mockRole,
        }),
      };

      const mockRoleModel = {
        findOne: jest.fn().mockReturnValue(mockRole),
      };

      const authController = new AuthenticationController({
        userModel: mockUserModel,
        roleModel: mockRoleModel,
        bcrypt,
        jwt,
      });
      await authController.handleLogin(mockRequest, mockResponse, mockNext);
      const token = authController.createTokenFromUser({
        ...mockUser,
        Role: mockRole,
      }, mockRole);

      expect(mockUserModel.findOne).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: token,
      });
    });

    it("should call res.status(404) and res.json with email not registered error",
      async () => {

        const email = "user@gmail.com";
        const password = "user123";

        const mockRequest = {
          body: {
            email,
            password,
          },
        };

        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        const mockNext = jest.fn();

        const mockUserModel = {
          findOne: jest.fn().mockReturnValue(null),
        };

        const mockRole = {
          id: 1,
          name: 'member'
        }

        const mockRoleModel = {
          findOne: jest.fn().mockReturnValue(mockRole),
        };

        const authController = new AuthenticationController({
          userModel: mockUserModel,
          roleModel: mockRoleModel,
          bcrypt,
          jwt,
        });
        await authController.handleLogin(mockRequest, mockResponse, mockNext);

        const err = new EmailNotRegisteredError(email);

        expect(mockUserModel.findOne).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith(err);
      }
    );
  });
});
