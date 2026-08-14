#!/usr/bin/env node
/**
 * Script de création d'utilisateur
 * Usage : node scripts/create-user.js "Dr Diallo" "medecin" "1234"
 *
 * Génère le hash SHA-256 compatible avec l'application.
 */

const CryptoJS = require("crypto-js");

const nom = process.argv[2] || "Dr Diallo";
const role = process.argv[3] || "medecin";
const pin = process.argv[4] || "1234";

const hash = CryptoJS.SHA256(`${pin}|${nom.toUpperCase()}`).toString(CryptoJS.enc.Hex);

console.log("══════════════════════════════════════════");
console.log("  UTILISATEUR À CRÉER");
console.log("══════════════════════════════════════════");
console.log(`  Nom   : ${nom}`);
console.log(`  Rôle  : ${role}`);
console.log(`  PIN   : ${pin}`);
console.log(`  Hash  : ${hash}`);
console.log("══════════════════════════════════════════");
console.log("");
console.log("Exécute ce SQL dans le Supabase SQL Editor :");
console.log("");
console.log(`INSERT INTO utilisateur (nom, role, code_pin_hash, est_actif)`);
console.log(`VALUES ('${nom}', '${role}', '${hash}', TRUE);`);
console.log("");