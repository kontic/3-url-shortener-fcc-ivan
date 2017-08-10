module.exports = function random_string(length) {
    var result = '';
    var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}