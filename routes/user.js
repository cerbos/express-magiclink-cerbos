const dotenv = require("dotenv");
const express = require("express");
const router = express.Router();
dotenv.config();

/* 1️⃣ Setup Magic Admin + Cerbos SDK */
const { Magic } = require("@magic-sdk/admin");
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

const { GRPC } = require("@cerbos/grpc");
const cerbos = new GRPC(
  process.env.CERBOS_INSTANCE,
  { tls: process.env.CERBOS_INSTANCE_TLS === "true" } // The Cerbos PDP instance
);

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
        attributes: {
          email: req.user.email,
        },
      },
      resources: [
        {
          resource: {
            kind: "contact",
            id: "5cc22de4",
            attributes: {
              owner: req.user.issuer,
              lastUpdated: new Date(2020, 10, 10).toISOString(),
            },
          },
          actions: ["read", "update", "delete"],
        },
        {
          resource: {
            kind: "contact",
            id: "ac29e6df",

            attributes: {
              owner: "auth0|6152dcc3ed3a290068aa12c2",
              lastUpdated: new Date(2020, 10, 12).toISOString(),
            },
          },
          actions: ["read", "update", "delete"],
        },
      ],
    };

    const decision = await cerbos.checkResources(cerbosPayload);
    console.log(decision);

    return res
      .status(200)
      .json({
        user: req.user,
        authorization: decision.results,
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
