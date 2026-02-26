#!/bin/bash
# Usage: ./loop.sh [options] [plan] [max_iterations]
# Examples:
#   ./loop.sh              # Build mode, verbose output (tools + messages)
#   ./loop.sh 20           # Build mode, max 20 iterations
#   ./loop.sh plan         # Plan mode, unlimited iterations
#   ./loop.sh plan 5       # Plan mode, max 5 iterations
#   ./loop.sh -s           # Build mode, summary output (tools only)
#   ./loop.sh -m           # Build mode, minimal output (tool names only)
#   ./loop.sh -q           # Build mode, quiet output (loop info only)
#   ./loop.sh -m plan 10   # Plan mode, minimal output, max 10 iterations
#   ./loop.sh --log loop.log  # Also save raw JSON to file
#
# Verbosity levels:
#   (default)  Full output: tools + assistant messages + session info
#   -s, --summary  Tools only: names + args + status (no messages)
#   -m, --minimal  Tool names only
#   -q, --quiet    Loop info only (no agent output)
#   --log <file>   Also write raw JSON stream to file

# Default verbosity: verbose (0=verbose, 1=summary, 2=minimal, 3=quiet)
VERBOSITY=0
LOG_FILE=""
USE_COLOR=true

# Parse options first
while [[ "$1" =~ ^- ]]; do
    case "$1" in
        -s|--summary)
            VERBOSITY=1
            shift
            ;;
        -m|--minimal)
            VERBOSITY=2
            shift
            ;;
        -q|--quiet)
            VERBOSITY=3
            shift
            ;;
        --log)
            LOG_FILE="$2"
            shift 2
            ;;
        --no-color)
            USE_COLOR=false
            shift
            ;;
        -h|--help)
            echo "Usage: ./loop.sh [options] [plan] [max_iterations]"
            echo ""
            echo "Options:"
            echo "  -s, --summary     Tools only (no assistant messages)"
            echo "  -m, --minimal     Tool names only"
            echo "  -q, --quiet       Loop info only (no agent output)"
            echo "  --log <file>      Also save raw JSON to file"
            echo "  --no-color        Disable colored output"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Verbosity (default shows tools + assistant messages + session info):"
            echo "  ./loop.sh              # Full verbose output"
            echo "  ./loop.sh -s           # Tools with args/status"
            echo "  ./loop.sh -m           # Tool names only"
            echo "  ./loop.sh -q           # Silent (loop info only)"
            echo ""
            echo "Examples:"
            echo "  ./loop.sh plan 5       # Plan mode, max 5 iterations"
            echo "  ./loop.sh -s 10        # Summary mode, max 10 iterations"
            echo "  ./loop.sh --log run.log  # Save JSON to file"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Parse remaining arguments (mode and max_iterations)
if [ "$1" = "plan" ]; then
    # Plan mode
    MODE="plan"
    PROMPT_FILE="PROMPT_plan.md"
    MAX_ITERATIONS=${2:-0}
elif [[ "$1" =~ ^[0-9]+$ ]]; then
    # Build mode with max iterations
    MODE="build"
    PROMPT_FILE="PROMPT_build.md"
    MAX_ITERATIONS=$1
else
    # Build mode, unlimited (no arguments or invalid input)
    MODE="build"
    PROMPT_FILE="PROMPT_build.md"
    MAX_ITERATIONS=0
fi

ITERATION=0
CURRENT_BRANCH=$(git branch --show-current)

# Verbosity level names
case $VERBOSITY in
    1) VERBOSITY_NAME="verbose" ;;
    2) VERBOSITY_NAME="summary" ;;
    3) VERBOSITY_NAME="minimal" ;;
    4) VERBOSITY_NAME="quiet" ;;
esac

# Color definitions (only if USE_COLOR is true and output is a terminal)
if [ "$USE_COLOR" = true ] && [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    MAGENTA='\033[0;35m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    MAGENTA=''
    NC=''
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Mode:      $MODE"
echo "Prompt:    $PROMPT_FILE"
echo "Branch:    $CURRENT_BRANCH"
echo "Output:    $VERBOSITY_NAME"
[ $MAX_ITERATIONS -gt 0 ] && echo "Max:       $MAX_ITERATIONS iterations"
[ -n "$LOG_FILE" ] && echo "Log:       $LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wrapper functions for unbuffered streaming (check stdbuf availability)
if command -v stdbuf &> /dev/null; then
    unbuf_sed() { stdbuf -oL sed -u "$@"; }
    unbuf_grep() { stdbuf -oL grep --line-buffered "$@"; }
    unbuf_jq() { stdbuf -oL jq --unbuffered "$@"; }
    unbuf_uniq() { stdbuf -oL uniq "$@"; }
else
    # Fallback: no line buffering (output may be delayed)
    unbuf_sed() { sed "$@"; }
    unbuf_grep() { grep "$@"; }
    unbuf_jq() { jq "$@"; }
    unbuf_uniq() { uniq "$@"; }
fi

# Filter function for verbose mode - shows full details including assistant messages
# Uses unbuffered streaming for real-time output
filter_verbose() {
    local tool_count=0
    local error_count=0
    local tool_start=""
    
    if ! command -v jq &> /dev/null; then
        cat
        echo "  ${YELLOW}── (install jq for formatted output)${NC}"
        return
    fi
    
    # Use unbuffered wrappers for real-time streaming
    unbuf_sed 's/}{/}\n{/g' | unbuf_jq -r '
        if .type == "system" and .subtype == "init" then
            "SYSTEM\t\(.session_id)\t\(.model)"
        elif .type == "assistant" then
            "ASSISTANT\t\((.message.content[0].text // "") | gsub("\n"; "\\n"))"
        elif .type == "tool_call" and .subtype == "started" then
            "TOOL_START\t\(.tool_call | keys[0] | sub("ToolCall$"; ""))\t\((.tool_call.shellToolCall.args.command // .tool_call.readToolCall.args.path // .tool_call.writeToolCall.args.path // .tool_call.strReplaceToolCall.args.path // .tool_call.grepToolCall.args.pattern // .tool_call.globToolCall.args.glob_pattern // "")[0:80])"
        elif .type == "tool_call" and .subtype == "completed" then
            "TOOL_END\t\(if (.tool_call | to_entries[0].value.result.error) then "ERROR\t\(.tool_call | to_entries[0].value.result.error.errorMessage // "Error")" elif (.tool_call.shellToolCall.result.success.exitCode // 0) != 0 then "ERROR\texit: \(.tool_call.shellToolCall.result.success.exitCode)" else "OK" end)"
        elif .type == "result" then
            "RESULT\t\(.duration_ms)\t\(.is_error)"
        else
            empty
        end
    ' 2>/dev/null | while IFS=$'\t' read -r event_type arg1 arg2; do
        case "$event_type" in
            SYSTEM)
                printf "  ${MAGENTA}Session:${NC} %s\n" "$arg1"
                printf "  ${MAGENTA}Model:${NC} %s\n" "$arg2"
                ;;
            ASSISTANT)
                if [ -n "$arg1" ]; then
                    # Unescape newlines and display
                    echo -e "$arg1" | while IFS= read -r msg_line; do
                        [ -n "$msg_line" ] && printf "  ${BLUE}│${NC} %s\n" "$msg_line"
                    done
                fi
                ;;
            TOOL_START)
                tool_start=$(date +%s%N)
                tool_count=$((tool_count + 1))
                if [ -n "$arg2" ]; then
                    printf "${CYAN}  → %s:${NC} %s" "$arg1" "$arg2"
                else
                    printf "${CYAN}  → %s${NC}" "$arg1"
                fi
                ;;
            TOOL_END)
                if [ -n "$tool_start" ]; then
                    duration_ns=$(($(date +%s%N) - tool_start))
                    duration_ms=$((duration_ns / 1000000))
                    if [ "$arg1" = "ERROR" ]; then
                        printf " ${RED}[✗ %s %dms]${NC}\n" "$arg2" "$duration_ms"
                        error_count=$((error_count + 1))
                    else
                        printf " ${GREEN}[✓ %dms]${NC}\n" "$duration_ms"
                    fi
                    tool_start=""
                fi
                ;;
            RESULT)
                if [ "$arg2" = "true" ]; then
                    printf "  ${RED}── failed${NC} (%sms, %d tools" "$arg1" "$tool_count"
                else
                    printf "  ${GREEN}── completed${NC} (%sms, %d tools" "$arg1" "$tool_count"
                fi
                [ $error_count -gt 0 ] && printf ", ${RED}%d errors${NC}" "$error_count"
                printf ")\n"
                ;;
        esac
    done
}

# Filter function for summary mode - shows tool names + key arguments + status (no assistant messages)
# Uses unbuffered streaming for real-time output
filter_summary() {
    local tool_count=0
    local error_count=0
    local tool_start=""
    
    if ! command -v jq &> /dev/null; then
        filter_minimal
        echo "  ${YELLOW}── (install jq for detailed summary)${NC}"
        return
    fi
    
    # Use unbuffered wrappers for real-time streaming
    unbuf_sed 's/}{/}\n{/g' | unbuf_jq -r '
        if .type == "tool_call" and .subtype == "started" then
            "TOOL_START\t\(.tool_call | keys[0] | sub("ToolCall$"; ""))\t\((.tool_call.shellToolCall.args.command // .tool_call.readToolCall.args.path // .tool_call.writeToolCall.args.path // .tool_call.strReplaceToolCall.args.path // "")[0:50])"
        elif .type == "tool_call" and .subtype == "completed" then
            "TOOL_END\t\(if (.tool_call | to_entries[0].value.result.error) then "ERROR\t\(.tool_call | to_entries[0].value.result.error.errorMessage // "Error")" elif (.tool_call.shellToolCall.result.success.exitCode // 0) != 0 then "ERROR\texit: \(.tool_call.shellToolCall.result.success.exitCode)" else "OK" end)"
        elif .type == "result" then
            "RESULT\t\(.duration_ms)\t\(.is_error)"
        else
            empty
        end
    ' 2>/dev/null | while IFS=$'\t' read -r event_type arg1 arg2; do
        case "$event_type" in
            TOOL_START)
                tool_start=$(date +%s%N)
                tool_count=$((tool_count + 1))
                if [ -n "$arg2" ]; then
                    printf "${CYAN}  → %s:${NC} %s" "$arg1" "$arg2"
                else
                    printf "${CYAN}  → %s${NC}" "$arg1"
                fi
                ;;
            TOOL_END)
                if [ -n "$tool_start" ]; then
                    duration_ns=$(($(date +%s%N) - tool_start))
                    duration_ms=$((duration_ns / 1000000))
                    if [ "$arg1" = "ERROR" ]; then
                        printf " ${RED}[✗ %s %dms]${NC}\n" "$arg2" "$duration_ms"
                        error_count=$((error_count + 1))
                    else
                        printf " ${GREEN}[✓ %dms]${NC}\n" "$duration_ms"
                    fi
                    tool_start=""
                fi
                ;;
            RESULT)
                if [ "$arg2" = "true" ]; then
                    printf "  ${RED}── failed${NC} (%sms, %d tools" "$arg1" "$tool_count"
                else
                    printf "  ${GREEN}── completed${NC} (%sms, %d tools" "$arg1" "$tool_count"
                fi
                [ $error_count -gt 0 ] && printf ", ${RED}%d errors${NC}" "$error_count"
                printf ")\n"
                ;;
        esac
    done
}

# Filter function for minimal mode - extracts key actions from JSON stream
# Uses unbuffered streaming for real-time output
filter_minimal() {
    # Split concatenated JSON objects, then extract tool names with line-buffered output
    unbuf_sed 's/}{/}\n{/g' | \
    unbuf_grep '"type":"tool_call".*"subtype":"started"' | \
    unbuf_sed 's/.*"tool_call":{"\([^"]*\)ToolCall".*/  → \1/' | \
    unbuf_uniq
}

# Filter function for quiet mode - shows nothing, just timing
filter_quiet() {
    cat > /dev/null
}

# Verify prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found"
    exit 1
fi

# Determine Cursor agent command (try 'agent' first, fallback to 'cursor agent')
if command -v agent &> /dev/null; then
    AGENT_CMD="agent"
elif command -v cursor &> /dev/null; then
    AGENT_CMD="cursor agent"
else
    echo "Error: Cursor agent command not found. Please install Cursor CLI:"
    echo "  curl https://cursor.com/install -fsS | bash"
    exit 1
fi

while true; do
    ITERATION=$((ITERATION + 1))
    
    if [ $MAX_ITERATIONS -gt 0 ] && [ $ITERATION -gt $MAX_ITERATIONS ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Reached max iterations: $MAX_ITERATIONS"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        break
    fi

    # Show loop header
    echo ""
    if [ $MAX_ITERATIONS -gt 0 ]; then
        LOOP_TEXT="LOOP $ITERATION/$MAX_ITERATIONS"
    else
        LOOP_TEXT="LOOP $ITERATION"
    fi
    BOX_WIDTH=41
    TEXT_LEN=${#LOOP_TEXT}
    PAD_LEFT=$(( (BOX_WIDTH - 2 - TEXT_LEN) / 2 ))
    PAD_RIGHT=$(( BOX_WIDTH - 2 - TEXT_LEN - PAD_LEFT ))
    echo "┌─────────────────────────────────────────┐"
    printf "│%*s%s%*s  │\n" "$PAD_LEFT" "" "$LOOP_TEXT" "$PAD_RIGHT" ""
    echo "└─────────────────────────────────────────┘"

    # Run agent with selected prompt and verbosity filter
    # -p: Headless mode (non-interactive, reads from stdin)
    # --force: Auto-approve all tool calls (YOLO mode)
    # --model Auto: Cursor's primary agent
    START_TIME=$(date +%s)
    SESSION_ID=""
    
    # Create a temporary file for agent output if logging or summary mode
    TEMP_OUTPUT=""
    if [ -n "$LOG_FILE" ] || [ $VERBOSITY -eq 1 ]; then
        TEMP_OUTPUT=$(mktemp)
    fi
    
    CURSOR_MODEL="composer-1.5"

    case $VERBOSITY in
        0)
            # Verbose: show full details including assistant messages
            if [ -n "$LOG_FILE" ]; then
                cat "$PROMPT_FILE" | $AGENT_CMD -p \
                    --force \
                    --model $CURSOR_MODEL \
                    --output-format=stream-json 2>&1 | tee -a "$LOG_FILE" | filter_verbose
            else
                cat "$PROMPT_FILE" | $AGENT_CMD -p \
                    --force \
                    --model $CURSOR_MODEL \
                    --output-format=stream-json 2>&1 | filter_verbose
            fi
            ;;
        1)
            # Summary: filter to show tool calls with details (no assistant messages)
            if [ -n "$LOG_FILE" ]; then
                cat "$PROMPT_FILE" | $AGENT_CMD -p \
                    --force \
                    --model $CURSOR_MODEL \
                    --output-format=stream-json 2>&1 | tee -a "$LOG_FILE" | filter_summary
            else
                cat "$PROMPT_FILE" | $AGENT_CMD -p \
                    --force \
                    --model $CURSOR_MODEL \
                    --output-format=stream-json 2>&1 | filter_summary
            fi
            ;;
        2)
            # Minimal: filter to show only tool names
            cat "$PROMPT_FILE" | $AGENT_CMD -p \
                --force \
                --model $CURSOR_MODEL \
                --output-format=stream-json 2>&1 | \
                ( [ -n "$LOG_FILE" ] && tee -a "$LOG_FILE" || cat ) | \
                filter_minimal
            END_TIME=$(date +%s)
            DURATION=$((END_TIME - START_TIME))
            printf "  ── completed in %ds\n" "$DURATION"
            ;;
        3)
            # Quiet: suppress agent output entirely
            echo "  Running agent..."
            cat "$PROMPT_FILE" | $AGENT_CMD -p \
                --force \
                --model $CURSOR_MODEL \
                --output-format=stream-json 2>&1 | \
                ( [ -n "$LOG_FILE" ] && tee -a "$LOG_FILE" || cat ) | \
                filter_quiet
            END_TIME=$(date +%s)
            DURATION=$((END_TIME - START_TIME))
            echo "  ${GREEN}✓${NC} Completed in ${DURATION}s"
            ;;
    esac
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Cleanup temp file if it still exists
    [ -n "$TEMP_OUTPUT" ] && [ -f "$TEMP_OUTPUT" ] && rm -f "$TEMP_OUTPUT"
done

echo ""
echo "Loop finished after $((ITERATION - 1)) iterations"