document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('problem-form');
    const input = document.getElementById('problem-input');
    const result = document.getElementById('result');

    const submitProblem = async () => {
        const problem = input.value;

        try {
            const response = await fetch('http://localhost:8000/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ problem }),
            });

            const data = await response.json();
            result.innerHTML = `Solution: ${data.solution}`;
        } catch (error) {
            console.error('Error:', error);
            result.innerHTML = 'An error occurred. Please try again.';
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const problem = input.value;

        try {
            // Use the /test endpoint for testing
            const response = await fetch('http://localhost:8000/test');
            const data = await response.json();
            result.innerHTML = `Server response: ${data}`;
        } catch (error) {
            console.error('Error:', error);
            result.innerHTML = 'An error occurred. Please try again.';
        }
    });
});
