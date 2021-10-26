const dotenv = require("dotenv");
const express = require("express");
const router = express.Router();
dotenv.config();

/* 1️⃣ Setup Magic Admin + Cerbos SDK */
const { Magic } = require("@magic-sdk/admin");
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

const { Cerbos } = require("cerbos");
const cerbos = new Cerbos({
  hostname: process.env.CERBOS_INSTANCE, // The Cerbos PDP instance
});

/* 2️⃣ Implement Auth Strategy */
const passport = require("passport");
const MagicStrategy = require("passport-magic").Strategy;

const strategy = new MagicStrategy(async function (user, done) {
  const userMetadata = await magic.users.getMetadataByIssuer(user.issuer);

  done(null, {
    issuer: user.issuer,
    email: userMetadata.email,
    lastLoginAt: user.claim.iat,
  });
});

passport.use(strategy);

/* Attach middleware to login endpoint */
router.post("/login", passport.authenticate("magic"), (req, res) => {
  if (req.user) {
    res.status(200).end("User is logged in.");
  } else {
    return res.status(401).end("Could not log user in.");
  }
});

/* 4️⃣ Implement Session Behavior */
/* This has been simplified for statelessness for demo reason */

/* Defines what data are stored in the user session */
passport.serializeUser((user, done) => {
  done(null, user);
});

/* Populates user data in the req.user object */
passport.deserializeUser(async (user, done) => {
  done(null, user);
});

/* 5️⃣ Implement User Endpoints */

/* Implement Get Data Endpoint */
router.get("/data", async (req, res) => {
  if (req.isAuthenticated()) {
    const cerbosPayload = {
      principal: {
        id: req.user.issuer,
        roles: ["user"],
        attr: {
          email: req.user.email,
        },
      },
      resource: {
        kind: "contact",
        instances: {
          "5cc22de4": {
            attr: {
              owner: req.user.issuer,
              lastUpdated: new Date(2020, 10, 10),
            },
          },
          ac29e6df: {
            attr: {
              owner: "auth0|6152dcc3ed3a290068aa12c2",
              lastUpdated: new Date(2020, 10, 12),
            },
          },
        },
      },
      actions: ["read", "update", "delete"],
      includeMeta: true,
    };

    const allowed = await cerbos.check(cerbosPayload);

    return res
      .status(200)
      .json({
        user: req.user,
        authorization: allowed,
      })
      .end();
  } else {
    return res.status(401).end(`User is not logged in.`);
  }
});

/* Implement Logout Endpoint */
router.post("/logout", async (req, res) => {
  if (req.isAuthenticated()) {
    await magic.users.logoutByIssuer(req.user.issuer);
    req.logout();
    return res.status(200).end();
  } else {
    return res.status(401).end(`User is not logged in.`);
  }
});

module.exports = router;
