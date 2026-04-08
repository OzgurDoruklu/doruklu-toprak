import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://izwubhjhqbmnxpddjljr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6d3ViaGpocWJtbnhwZGRqbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Njk5MjEsImV4cCI6MjA5MTI0NTkyMX0.luiCToferkH0Z3z59rh-4tzPA1yXqe4gM_ob3_qMLJU';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Oturum bazlı global değişkenler
export const AppState = {
    user: null,
    profile: null,
    sessionStart: null,
    currentScore: 0,
    questionsAnswered: [],
    correctCount: 0,
    incorrectCount: 0
};
