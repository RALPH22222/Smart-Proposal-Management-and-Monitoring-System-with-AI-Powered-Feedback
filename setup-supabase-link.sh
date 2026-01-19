#!/bin/bash

# Setup script to link Supabase project
# Run this script to connect your local workspace to your Supabase database

echo "================================================"
echo "Supabase Project Setup"
echo "================================================"
echo ""

# Step 1: Login to Supabase
echo "Step 1: Login to Supabase"
echo "This will open a browser window for authentication..."
npx supabase login

# Step 2: Link the project
echo ""
echo "Step 2: Link to your Supabase project"
npx supabase link --project-ref ilutdlvlhjpxsyvedyxf

# Step 3: Pull the database schema
echo ""
echo "Step 3: Pull the latest database schema"
npx supabase db pull

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "Your database schema is now in: supabase/migrations/"
echo "You can update it anytime by running: npx supabase db pull"
echo ""
