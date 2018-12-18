
import PasswordResetHandler
  from "./PasswordResetHandler";
import { UserDataStore } from "../../../storage/UserDataStore";
import Sinon = require("sinon");
import winston = require("winston");
import assert = require("assert");
import BluebirdPromise = require("bluebird");
import ExpressMock = require("../../../stubs/express.spec");
import { ServerVariablesMock, ServerVariablesMockBuilder }
  from "../../../ServerVariablesMockBuilder.spec";
import { ServerVariables } from "../../../ServerVariables";

describe("routes/password-reset/identity/PasswordResetHandler", function () {
  let req: ExpressMock.RequestMock;
  let res: ExpressMock.ResponseMock;
  let mocks: ServerVariablesMock;
  let vars: ServerVariables;

  beforeEach(function () {
    req = {
      originalUrl: "/non-api/xxx",
      query: {
        userid: "user"
      },
      session: {
        auth: {
          userid: "user",
          email: "user@example.com",
          first_factor: true,
          second_factor: false
        }
      },
      headers: {
        host: "localhost"
      }
    };

    const options = {
      inMemoryOnly: true
    };

    const s = ServerVariablesMockBuilder.build();
    mocks = s.mocks;
    vars = s.variables;

    mocks.userDataStore.saveU2FRegistrationStub
      .returns(BluebirdPromise.resolve({}));
    mocks.userDataStore.retrieveU2FRegistrationStub
      .returns(BluebirdPromise.resolve({}));
    mocks.userDataStore.produceIdentityValidationTokenStub
      .returns(BluebirdPromise.resolve({}));
    mocks.userDataStore.consumeIdentityValidationTokenStub
      .returns(BluebirdPromise.resolve({}));
    res = ExpressMock.ResponseMock();
  });

  describe("test reset password identity pre check", () => {
    it("should fail when no userid is provided", function () {
      req.query.userid = undefined;
      const handler = new PasswordResetHandler(vars.logger,
        vars.usersDatabase);
      return handler.preValidationInit(req as any)
        .then(function () {
          return BluebirdPromise.reject("It should fail");
        })
        .catch(function (err: Error) {
          return BluebirdPromise.resolve();
        });
    });

    it("should fail if ldap fail", function () {
      mocks.usersDatabase.getEmailsStub
        .returns(BluebirdPromise.reject("Internal error"));
      new PasswordResetHandler(vars.logger, vars.usersDatabase)
        .preValidationInit(req as any)
        .then(function () {
          return BluebirdPromise.reject(new Error("should not be here"));
        },
        function (err: Error) {
          return BluebirdPromise.resolve();
        });
    });

    it("should returns identity when ldap replies", function () {
      mocks.usersDatabase.getEmailsStub
        .returns(BluebirdPromise.resolve(["test@example.com"]));
      return new PasswordResetHandler(vars.logger, vars.usersDatabase)
        .preValidationInit(req as any);
    });
  });
});
